import { GetConfiguration } from '@nitrots/nitro-renderer';
import { FC, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GetConfigurationValue, LocalizeText } from '../../api';
import { TurnstileWidget } from './TurnstileWidget';

const t = (key: string, fallback: string, params?: string[], replacements?: string[]): string =>
{
    try
    {
        const value = LocalizeText(key, params ?? null, replacements ?? null);
        if(value && value !== key) return value;
    }
    catch {}

    if(!params || !replacements) return fallback;
    let out = fallback;
    for(let i = 0; i < params.length; i++)
    {
        if(replacements[i] !== undefined) out = out.replace('%' + params[i] + '%', replacements[i]);
    }
    return out;
};

type DialogMode = 'login' | 'register' | 'forgot';

const interpolate = (value: string | null | undefined): string =>
{
    if(!value) return '';
    try { return GetConfiguration().interpolate(value); }
    catch { return value; }
};

const LOCK_KEY = 'nitro.login.lock';
const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 60_000;
const LOCK_DURATION_MS = 2 * 60_000;

type AttemptState = { attempts: number; firstAt: number; lockedUntil: number };

const readLock = (): AttemptState =>
{
    try
    {
        const raw = sessionStorage.getItem(LOCK_KEY);
        if(!raw) return { attempts: 0, firstAt: 0, lockedUntil: 0 };
        return JSON.parse(raw);
    }
    catch { return { attempts: 0, firstAt: 0, lockedUntil: 0 }; }
};

const writeLock = (state: AttemptState) =>
{
    try { sessionStorage.setItem(LOCK_KEY, JSON.stringify(state)); }
    catch { }
};

export interface LoginViewProps
{
    onAuthenticated: (ssoTicket: string) => void;
}

export const LoginView: FC<LoginViewProps> = ({ onAuthenticated }) =>
{
    const [ mode, setMode ] = useState<DialogMode>('login');
    const [ username, setUsername ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ error, setError ] = useState<string | null>(null);
    const [ info, setInfo ] = useState<string | null>(null);
    const [ submitting, setSubmitting ] = useState(false);
    const [ loginTurnstileToken, setLoginTurnstileToken ] = useState('');
    const [ loginTurnstileResetSignal, setLoginTurnstileResetSignal ] = useState(0);
    const [ loginServerReachable, setLoginServerReachable ] = useState<boolean | null>(null);
    const [ loginPingingServer, setLoginPingingServer ] = useState(false);
    const submitTimeRef = useRef(0);

    const loginImages: Record<string, string> = ((GetConfigurationValue<Record<string, unknown>>('loginview', {})?.['images']) as Record<string, string>) ?? {};

    const backgroundColor = (loginImages['background.colour'] || GetConfigurationValue<string>('login_background.colour', '#6eadc8'));
    const background = interpolate(loginImages['background'] || GetConfigurationValue<string>('login_background', ''));
    const sun = interpolate(loginImages['sun'] || GetConfigurationValue<string>('login_sun', ''));
    const drape = interpolate(loginImages['drape'] || GetConfigurationValue<string>('login_drape', ''));
    const left = interpolate(loginImages['left'] || GetConfigurationValue<string>('login_left', ''));
    const rightRepeat = interpolate(loginImages['right.repeat'] || GetConfigurationValue<string>('login_right.repeat', ''));
    const right = interpolate(loginImages['right'] || GetConfigurationValue<string>('login_right', ''));
    const loginUrl = GetConfigurationValue<string>('login.endpoint', '/api/auth/login');
    const registerUrl = GetConfigurationValue<string>('login.register.endpoint', '/api/auth/register');
    const roomTemplatesUrl = GetConfigurationValue<string>('login.room_templates.endpoint', '/api/auth/room-templates');
    const forgotUrl = GetConfigurationValue<string>('login.forgot.endpoint', '/api/auth/forgot-password');
    const turnstileSiteKey = GetConfigurationValue<string>('login.turnstile.sitekey', '');
    const rawTurnstileEnabled = GetConfigurationValue<unknown>('login.turnstile.enabled', false);
    const turnstileEnabled = (rawTurnstileEnabled === true
        || rawTurnstileEnabled === 'true'
        || rawTurnstileEnabled === 1
        || rawTurnstileEnabled === '1') && !!turnstileSiteKey;

    const resetLoginTurnstile = useCallback(() =>
    {
        setLoginTurnstileToken('');
        setLoginTurnstileResetSignal(prev => prev + 1);
    }, []);

    useEffect(() =>
    {
        setError(null);
        if(mode === 'login') resetLoginTurnstile();
    }, [ mode, resetLoginTurnstile ]);

    useEffect(() =>
    {
        if(!info) return;
        const timeout = window.setTimeout(() => setInfo(null), 8000);
        return () => window.clearTimeout(timeout);
    }, [ info ]);

    const lockState = useMemo(() => readLock(), [ submitting ]);
    const now = Date.now();
    const isLocked = lockState.lockedUntil > now;

    const recordFailure = useCallback(() =>
    {
        const state = readLock();
        const currentNow = Date.now();

        if(currentNow - state.firstAt > LOCK_WINDOW_MS)
        {
            writeLock({ attempts: 1, firstAt: currentNow, lockedUntil: 0 });
            return;
        }

        const attempts = state.attempts + 1;
        const lockedUntil = attempts >= MAX_ATTEMPTS ? currentNow + LOCK_DURATION_MS : 0;
        writeLock({ attempts, firstAt: state.firstAt || currentNow, lockedUntil });
    }, []);

    const clearLock = useCallback(() =>
    {
        writeLock({ attempts: 0, firstAt: 0, lockedUntil: 0 });
    }, []);

    const postJson = useCallback(async (url: string, body: Record<string, unknown>) =>
    {
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'NitroLoginView'
            },
            body: JSON.stringify(body)
        });

        let payload: Record<string, unknown> = {};
        try { payload = await response.json(); }
        catch { }

        return { ok: response.ok, status: response.status, payload };
    }, []);

    const healthUrl = GetConfigurationValue<string>('login.health.endpoint', '/api/health');
    const healthMethodRaw = GetConfigurationValue<string>('login.health.method', 'GET');
    const healthMethod = (healthMethodRaw || 'GET').toUpperCase();
    const checkServerReachable = useCallback(async (): Promise<boolean> =>
    {
        if(!healthUrl) return true;
        try
        {
            const controller = new AbortController();
            const timer = window.setTimeout(() => controller.abort(), 5000);
            try
            {
                const response = await fetch(healthUrl, { method: healthMethod, credentials: 'omit', signal: controller.signal });
                if(response.status === 403) return false;
                if(response.status >= 500) return false;
                return true;
            }
            finally
            {
                window.clearTimeout(timer);
            }
        }
        catch
        {
            return false;
        }
    }, [ healthUrl, healthMethod ]);

    const pingLoginServer = useCallback(async () =>
    {
        setLoginPingingServer(true);
        try
        {
            const ok = await checkServerReachable();
            setLoginServerReachable(ok);
            return ok;
        }
        finally
        {
            setLoginPingingServer(false);
        }
    }, [ checkServerReachable ]);

    useEffect(() =>
    {
        let cancelled = false;
        (async () =>
        {
            const ok = await checkServerReachable();
            if(!cancelled) setLoginServerReachable(ok);
        })();
        return () => { cancelled = true; };
    }, [ checkServerReachable ]);

    const handleLoginSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) =>
    {
        event.preventDefault();

        if(submitting) return;

        const nowTs = Date.now();
        if(nowTs - submitTimeRef.current < 1000) return;
        submitTimeRef.current = nowTs;

        const state = readLock();
        if(state.lockedUntil > nowTs)
        {
            const remaining = Math.ceil((state.lockedUntil - nowTs) / 1000);
            setError(t('nitro.login.error.too_many_attempts', 'Too many attempts. Try again in %seconds%s.', [ 'seconds' ], [ String(remaining) ]));
            return;
        }

        if(!username.trim() || !password)
        {
            setError(t('nitro.login.error.missing_credentials', 'Please enter both your Habbo name and password.'));
            return;
        }

        if(turnstileEnabled && !loginTurnstileToken)
        {
            setError(t('nitro.login.error.turnstile', 'Please complete the security check.'));
            return;
        }

        setError(null);
        setSubmitting(true);

        try
        {
            const serverOk = await pingLoginServer();
            if(!serverOk)
            {
                setError(t('nitro.login.error.server_offline', 'The gameserver is not running. Please try again later.'));
                return;
            }
            const { ok, payload } = await postJson(loginUrl, {
                username: username.trim(),
                password,
                turnstileToken: turnstileEnabled ? loginTurnstileToken : undefined
            });

            const ssoTicket = typeof payload.ssoTicket === 'string' ? payload.ssoTicket : (typeof payload.sso === 'string' ? payload.sso : '');

            if(ok && ssoTicket)
            {
                clearLock();
                onAuthenticated(ssoTicket);
                return;
            }

            recordFailure();
            const message = typeof payload.error === 'string' ? payload.error : t('nitro.login.error.invalid_credentials', 'Invalid Habbo name or password.');
            setError(message);
            resetLoginTurnstile();
        }
        catch(err)
        {
            recordFailure();
            setError(t('nitro.login.error.login_unreachable', 'Unable to reach the login service. Please try again.'));
            resetLoginTurnstile();
        }
        finally
        {
            setSubmitting(false);
        }
    }, [ submitting, username, password, turnstileEnabled, loginTurnstileToken, loginUrl, postJson, clearLock, recordFailure, onAuthenticated, resetLoginTurnstile, pingLoginServer ]);

    const checkEmailUrl = GetConfigurationValue<string>('login.check-email.endpoint', '/api/auth/check-email');
    const checkUsernameUrl = GetConfigurationValue<string>('login.check-username.endpoint', '/api/auth/check-username');
    const imagingUrl = GetConfigurationValue<string>('login.register.imaging.url', 'https://www.habbo.com/habbo-imaging/avatarimage?figure={figure}&gender={gender}&direction=2&head_direction=2&size=l');
    const interpretAvailability = (ok: boolean, status: number, payload: Record<string, unknown>): { available: boolean; error?: string } =>
    {
        const isTrue = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1';
        const isFalse = (v: unknown) => v === false || v === 'false' || v === 0 || v === '0';

        if(ok)
        {
            if(isTrue(payload.available) || isFalse(payload.exists) || isFalse(payload.taken) || isFalse(payload.inUse) || isFalse(payload.in_use)) return { available: true };
            if(isFalse(payload.available) || isTrue(payload.exists) || isTrue(payload.taken) || isTrue(payload.inUse) || isTrue(payload.in_use)) return { available: false, error: typeof payload.error === 'string' ? payload.error : undefined };
            return { available: true };
        }

        if(status === 404 || status === 405 || status === 501) return { available: true };
        if(status === 409) return { available: false, error: typeof payload.error === 'string' ? payload.error : undefined };

        return { available: true };
    };

    const checkEmailAvailable = useCallback(async (email: string): Promise<{ available: boolean; error?: string }> =>
    {
        try
        {
            const { ok, status, payload } = await postJson(checkEmailUrl, { email });
            const result = interpretAvailability(ok, status, payload);
            if(result.available) return { available: true };
            return { available: false, error: result.error || t('nitro.login.error.email_taken', 'This email is already in use.') };
        }
        catch
        {
            return { available: true };
        }
    }, [ checkEmailUrl, postJson ]);

    const checkUsernameAvailable = useCallback(async (username: string): Promise<{ available: boolean; error?: string }> =>
    {
        try
        {
            const { ok, status, payload } = await postJson(checkUsernameUrl, { username });
            const result = interpretAvailability(ok, status, payload);
            if(result.available) return { available: true };
            return { available: false, error: result.error || t('nitro.login.error.username_taken', 'This Habbo name is already taken.') };
        }
        catch
        {
            return { available: true };
        }
    }, [ checkUsernameUrl, postJson ]);

    const handleRegisterSubmit = useCallback(async (body: { username: string; email: string; password: string; figure: string; gender: string; turnstileToken: string; templateId: number | null; }, onDialogReset: () => void) =>
    {
        if(turnstileEnabled && !body.turnstileToken)
        {
            setError(t('nitro.login.error.turnstile', 'Please complete the security check.'));
            return;
        }

        setError(null);
        setInfo(null);
        setSubmitting(true);

        try
        {
            const { ok, payload } = await postJson(registerUrl, {
                username: body.username,
                email: body.email,
                password: body.password,
                figure: body.figure,
                gender: body.gender,
                templateId: body.templateId ?? undefined,
                turnstileToken: turnstileEnabled ? body.turnstileToken : undefined
            });

            if(ok)
            {
                const friendly = t('nitro.login.register.success', 'Welcome aboard, %username%! Your account is ready — log in below with the password you just chose.', [ 'username' ], [ body.username ]);
                setInfo(typeof payload.message === 'string' ? payload.message : friendly);
                setMode('login');
                setUsername(body.username);
                setPassword('');
                return;
            }

            setError(typeof payload.error === 'string' ? payload.error : t('nitro.login.error.register_failed', 'Unable to create your account.'));
            onDialogReset();
        }
        catch
        {
            setError(t('nitro.login.error.register_unreachable', 'Unable to reach the registration service.'));
            onDialogReset();
        }
        finally
        {
            setSubmitting(false);
        }
    }, [ turnstileEnabled, registerUrl, postJson ]);

    const handleForgotSubmit = useCallback(async (body: { email: string; turnstileToken: string; }, onDialogReset: () => void) =>
    {
        if(turnstileEnabled && !body.turnstileToken)
        {
            setError(t('nitro.login.error.turnstile', 'Please complete the security check.'));
            return;
        }

        setError(null);
        setInfo(null);
        setSubmitting(true);

        try
        {
            const { ok, payload } = await postJson(forgotUrl, {
                email: body.email,
                turnstileToken: turnstileEnabled ? body.turnstileToken : undefined
            });

            if(ok)
            {
                const friendly = t('nitro.login.forgot.success', 'Email sent! If an account matches that address you\'ll find a reset link in your inbox shortly (check spam if it doesn\'t show up within a minute).');
                setInfo(typeof payload.message === 'string' ? payload.message : friendly);
                setMode('login');
                return;
            }

            setError(typeof payload.error === 'string' ? payload.error : t('nitro.login.error.forgot_failed', 'Unable to send a reset email right now.'));
            onDialogReset();
        }
        catch
        {
            setError(t('nitro.login.error.forgot_unreachable', 'Unable to reach the password reset service.'));
            onDialogReset();
        }
        finally
        {
            setSubmitting(false);
        }
    }, [ turnstileEnabled, forgotUrl, postJson ]);

    return (
        <div
            className="nitro-login-view"
            style={ backgroundColor ? { background: backgroundColor } : undefined }
        >
            { background ? <div className="login-background login-layer" style={ { backgroundImage: `url(${ background })` } } /> : null }
            { sun ? <div className="login-sun login-layer" style={ { backgroundImage: `url(${ sun })` } } /> : null }
            { drape ? <div className="login-drape login-layer" style={ { backgroundImage: `url(${ drape })` } } /> : null }
            { left ? <div className="login-left login-layer" style={ { backgroundImage: `url(${ left })` } } /> : null }
            { rightRepeat ? <div className="login-right-repeat login-layer" style={ { backgroundImage: `url(${ rightRepeat })` } } /> : null }
            { right ? <div className="login-right login-layer" style={ { backgroundImage: `url(${ right })` } } /> : null }

            <div className="login-stack">
                <div className="nitro-login-card">
                    <div className="card-title">{ t('nitro.login.firsttime.title', 'First time here?') }</div>
                    <div className="card-body register-card-body">
                        <span>{ t('nitro.login.firsttime.text', 'Don\'t have a Habbo yet?') }</span>
                        <a onClick={ () => setMode('register') }>{ t('nitro.login.firsttime.link', 'You can create one here') }</a>
                    </div>
                </div>

                <div className="nitro-login-card">
                    <div className="card-title">{ t('nitro.login.card.title', 'What\'s your Habbo called?') }</div>
                    <form className="card-body" onSubmit={ handleLoginSubmit } autoComplete="on">
                        <div className="field">
                            <label htmlFor="login-username">{ t('login.username', 'Name of your Habbo') }</label>
                            <input
                                id="login-username"
                                name="username"
                                autoComplete="username"
                                type="text"
                                maxLength={ 32 }
                                value={ username }
                                onChange={ e => setUsername(e.target.value) }
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="login-password">{ t('generic.password', 'Password') }</label>
                            <input
                                id="login-password"
                                name="password"
                                autoComplete="current-password"
                                type="password"
                                maxLength={ 128 }
                                value={ password }
                                onChange={ e => setPassword(e.target.value) }
                            />
                        </div>
                        { turnstileEnabled && mode === 'login' &&
                            <TurnstileWidget
                                siteKey={ turnstileSiteKey }
                                size="compact"
                                onToken={ setLoginTurnstileToken }
                                onExpire={ () => setLoginTurnstileToken('') }
                                onError={ () => setLoginTurnstileToken('') }
                                resetSignal={ loginTurnstileResetSignal }
                            /> }
                        { loginServerReachable === false &&
                            <div className="error-line server-offline">
                                { t('nitro.login.server.offline.short', 'The gameserver isn\'t running right now. Please try again in a moment.') }
                                <button type="button" className="retry-link" onClick={ pingLoginServer } disabled={ loginPingingServer }>
                                    { loginPingingServer ? t('nitro.login.server.checking', 'Checking…') : t('nitro.login.server.retry', 'Retry') }
                                </button>
                            </div>
                        }
                        { error && <div className="error-line">{ error }</div> }
                        { info && <div className="info-line">{ info }</div> }
                        <div className="submit-row">
                            <button
                                type="submit"
                                className="ok-button"
                                disabled={ submitting || isLocked || loginServerReachable === false || loginPingingServer }
                            >{ loginPingingServer ? t('nitro.login.server.checking', 'Checking…') : t('login.title', 'Log in') }</button>
                        </div>
                        <a className="forgot" onClick={ () => setMode('forgot') }>{ t('login.forgot_password', 'Forgotten your password?') }</a>
                    </form>
                </div>
            </div>

            { mode === 'register' &&
                <RegisterDialog
                    onCancel={ () => setMode('login') }
                    onSubmit={ handleRegisterSubmit }
                    onCheckEmail={ checkEmailAvailable }
                    onCheckUsername={ checkUsernameAvailable }
                    onCheckServer={ checkServerReachable }
                    imagingUrl={ imagingUrl }
                    roomTemplatesUrl={ roomTemplatesUrl }
                    submitting={ submitting }
                    error={ error }
                    info={ info }
                    turnstileEnabled={ turnstileEnabled }
                    turnstileSiteKey={ turnstileSiteKey }
                /> }

            { mode === 'forgot' &&
                <ForgotDialog
                    onCancel={ () => setMode('login') }
                    onSubmit={ handleForgotSubmit }
                    submitting={ submitting }
                    error={ error }
                    info={ info }
                    turnstileEnabled={ turnstileEnabled }
                    turnstileSiteKey={ turnstileSiteKey }
                /> }
        </div>
    );
};

interface DialogSharedProps
{
    onCancel: () => void;
    submitting: boolean;
    error: string | null;
    info: string | null;
    turnstileEnabled: boolean;
    turnstileSiteKey: string;
}

interface RegisterDialogProps extends DialogSharedProps
{
    onSubmit: (body: { username: string; email: string; password: string; figure: string; gender: string; turnstileToken: string; templateId: number | null; }, onDialogReset: () => void) => void;
    onCheckEmail: (email: string) => Promise<{ available: boolean; error?: string }>;
    onCheckUsername: (username: string) => Promise<{ available: boolean; error?: string }>;
    onCheckServer: () => Promise<boolean>;
    imagingUrl: string;
    roomTemplatesUrl: string;
}

type RegisterStep = 'credentials' | 'avatar' | 'room';

interface RoomTemplate { templateId: number; title: string; description: string; thumbnail: string; }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type GenderKey = 'M' | 'F';

const PART_ROWS: string[] = [ 'hr', 'hd', 'ch', 'lg', 'sh' ];

const FALLBACK_DEFAULTS: Record<GenderKey, Record<string, { partId: number; colors: number[] }>> = {
    M: {
        hr: { partId: 180, colors: [ 45 ] },
        hd: { partId: 180, colors: [ 1 ] },
        ch: { partId: 215, colors: [ 66 ] },
        lg: { partId: 270, colors: [ 82 ] },
        sh: { partId: 290, colors: [ 80 ] }
    },
    F: {
        hr: { partId: 515, colors: [ 45 ] },
        hd: { partId: 600, colors: [ 1 ] },
        ch: { partId: 660, colors: [ 100 ] },
        lg: { partId: 716, colors: [ 82 ] },
        sh: { partId: 725, colors: [ 61 ] }
    }
};

const FALLBACK_HEX: Record<number, string> = {
    1: '#ffcb98', 8: '#f4ac54', 14: '#f5da88', 19: '#b87560', 20: '#9c543f',
    45: '#e8c498', 61: '#f1ece3', 66: '#96743d', 80: '#4f4d4d', 82: '#7f4f30',
    92: '#ececec', 100: '#c7ddff', 106: '#c6e6bd', 110: '#91a7c8', 143: '#ffffff'
};

interface FigureColor { id: number; hexCode: string; club: number; selectable: boolean; }
interface FigurePalette { id: number; colors: FigureColor[]; }
interface FigureSet { id: number; gender: 'M' | 'F' | 'U'; club: number; selectable: boolean; }
interface FigureSetType { type: string; paletteId: number; sets: FigureSet[]; }
interface FigureData { palettes: FigurePalette[]; setTypes: FigureSetType[]; }

interface PartSelection { partId: number; colors: number[]; }
type FigureSelection = Record<string, PartSelection>;

const buildFigureString = (selection: FigureSelection): string =>
{
    const seen = new Set<string>();
    const parts: string[] = [];
    const push = (setType: string) =>
    {
        if(seen.has(setType)) return;
        seen.add(setType);
        const sel = selection[setType];
        if(!sel || sel.partId < 0) return;
        const tail = (sel.colors && sel.colors.length) ? `-${ sel.colors.join('-') }` : '';
        parts.push(`${ setType }-${ sel.partId }${ tail }`);
    };
    for(const setType of PART_ROWS) push(setType);
    for(const setType of Object.keys(selection)) push(setType);
    return parts.join('.');
};

const buildImagingUrl = (template: string, figure: string, gender: GenderKey): string =>
    template
        .replace(/\{figure\}/g, encodeURIComponent(figure))
        .replace(/\{gender\}/g, gender)
        .replace(/\{direction\}/g, '2');

const HEAD_ONLY_PARTS = new Set([ 'hr', 'hd' ]);

const buildPartPreviewUrl = (
    template: string,
    setType: string,
    selection: FigureSelection,
    gender: GenderKey
): string =>
{
    const defaults = FALLBACK_DEFAULTS[gender];
    const partSel = selection[setType] ?? defaults[setType];
    const tail = (partSel.colors && partSel.colors.length) ? `-${ partSel.colors.join('-') }` : '';
    const isHeadOnly = HEAD_ONLY_PARTS.has(setType);

    let parts: string[];
    if(isHeadOnly)
    {
        const hd = defaults.hd;
        const pieces = new Map<string, string>();
        pieces.set('hd', `hd-${ hd.partId }-${ hd.colors.join('-') }`);
        pieces.set(setType, `${ setType }-${ partSel.partId }${ tail }`);
        parts = Array.from(pieces.values());
    }
    else
    {
        const hd = defaults.hd;
        parts = [
            `hd-${ hd.partId }-${ hd.colors.join('-') }`,
            `${ setType }-${ partSel.partId }${ tail }`
        ];
    }

    const figure = parts.join('.');
    let url = template
        .replace(/\{figure\}/g, encodeURIComponent(figure))
        .replace(/\{gender\}/g, gender)
        .replace(/\{direction\}/g, '2');

    url = url.replace(/size=l/, 'size=s').replace(/size=m/, 'size=s');
    if(!/size=/.test(url)) url += (url.includes('?') ? '&' : '?') + 'size=s';
    if(isHeadOnly && !/headonly=/.test(url)) url += '&headonly=1';

    return url;
};

const RegisterDialog: FC<RegisterDialogProps> = props =>
{
    const { onCancel, onSubmit, onCheckEmail, onCheckUsername, onCheckServer, imagingUrl, roomTemplatesUrl, submitting, error, info, turnstileEnabled, turnstileSiteKey } = props;

    const [ step, setStep ] = useState<RegisterStep>('credentials');
    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ confirm, setConfirm ] = useState('');
    const [ username, setUsername ] = useState('');
    const [ gender, setGender ] = useState<GenderKey>('F');
    const [ selection, setSelection ] = useState<FigureSelection>(() => ({ ...FALLBACK_DEFAULTS.F }));
    const [ localError, setLocalError ] = useState<string | null>(null);
    const [ checking, setChecking ] = useState(false);
    const [ turnstileToken, setTurnstileToken ] = useState('');
    const [ resetSignal, setResetSignal ] = useState(0);
    const [ serverReachable, setServerReachable ] = useState<boolean | null>(null);
    const [ pingingServer, setPingingServer ] = useState(false);

    const pingServer = useCallback(async () =>
    {
        setPingingServer(true);
        try
        {
            const ok = await onCheckServer();
            setServerReachable(ok);
            return ok;
        }
        finally
        {
            setPingingServer(false);
        }
    }, [ onCheckServer ]);

    useEffect(() =>
    {
        let cancelled = false;
        (async () =>
        {
            const ok = await onCheckServer();
            if(!cancelled) setServerReachable(ok);
        })();
        return () => { cancelled = true; };
    }, [ onCheckServer ]);

    const resetWidget = useCallback(() =>
    {
        setTurnstileToken('');
        setResetSignal(prev => prev + 1);
    }, []);

    useEffect(() => { setLocalError(null); }, [ step ]);

    const [ roomTemplates, setRoomTemplates ] = useState<RoomTemplate[] | null>(null);
    const [ roomTemplatesError, setRoomTemplatesError ] = useState<string | null>(null);
    const [ selectedTemplateId, setSelectedTemplateId ] = useState<number | null>(null);

    const [ figureData, setFigureData ] = useState<FigureData | null>(null);
    const figureDataUrlRaw = GetConfigurationValue<string>('avatar.figuredata.url', '');
    const figureDataUrl = useMemo(() =>
    {
        if(!figureDataUrlRaw) return '';
        try { return GetConfiguration().interpolate(figureDataUrlRaw); }
        catch { return figureDataUrlRaw; }
    }, [ figureDataUrlRaw ]);

    useEffect(() =>
    {
        if(step !== 'avatar' || figureData || !figureDataUrl) return;
        let cancelled = false;
        fetch(figureDataUrl, { credentials: 'omit' })
            .then(r => r.ok ? r.json() : null)
            .then(json => { if(!cancelled && json) setFigureData(json as FigureData); })
            .catch(() => { });
        return () => { cancelled = true; };
    }, [ step, figureData, figureDataUrl ]);

    useEffect(() =>
    {
        if(step !== 'room' || roomTemplates !== null || !roomTemplatesUrl) return;
        let cancelled = false;
        setRoomTemplatesError(null);
        fetch(roomTemplatesUrl, { credentials: 'include' })
            .then(async r => {
                if(!r.ok) throw new Error(`status ${ r.status }`);
                return r.json();
            })
            .then(json => {
                if(cancelled) return;
                const list = Array.isArray((json as { templates?: unknown })?.templates)
                    ? (json as { templates: RoomTemplate[] }).templates
                    : [];
                setRoomTemplates(list);
            })
            .catch(() => {
                if(cancelled) return;
                setRoomTemplates([]);
                setRoomTemplatesError(t('nitro.login.register.room.error', 'Could not load room options. You can still skip this step.'));
            });
        return () => { cancelled = true; };
    }, [ step, roomTemplates, roomTemplatesUrl ]);

    const partOptions = useMemo(() =>
    {
        const result: Record<string, Record<GenderKey, number[]>> = {};
        if(!figureData) return result;
        for(const st of figureData.setTypes)
        {
            if(!PART_ROWS.includes(st.type)) continue;
            const forGender = (g: GenderKey) => st.sets
                .filter(s => s.selectable && s.club === 0 && (s.gender === g || s.gender === 'U'))
                .map(s => s.id);
            result[st.type] = { M: forGender('M'), F: forGender('F') };
        }
        return result;
    }, [ figureData ]);

    const paletteOptions = useMemo(() =>
    {
        const result: Record<string, { id: number; hex: string }[]> = {};
        if(!figureData) return result;
        for(const st of figureData.setTypes)
        {
            if(!PART_ROWS.includes(st.type)) continue;
            const palette = figureData.palettes.find(p => p.id === st.paletteId);
            if(!palette) { result[st.type] = []; continue; }
            result[st.type] = palette.colors
                .filter(c => c.selectable && c.club === 0)
                .map(c => ({ id: c.id, hex: '#' + c.hexCode.toUpperCase() }));
        }
        return result;
    }, [ figureData ]);

    const hexFor = useCallback((setType: string, colorId: number): string =>
    {
        const list = paletteOptions[setType];
        if(list)
        {
            const found = list.find(c => c.id === colorId);
            if(found) return found.hex;
        }
        return FALLBACK_HEX[colorId] || '#c9c9c9';
    }, [ paletteOptions ]);

    const [ hotLooks, setHotLooks ] = useState<{ gender: GenderKey; figure: string }[]>([]);
    const [ hotLookIndex, setHotLookIndex ] = useState(-1);

    useEffect(() =>
    {
        if(step !== 'avatar' || hotLooks.length) return;
        let cancelled = false;
        fetch('hotlooks.json', { credentials: 'omit' })
            .then(r => r.ok ? r.json() : null)
            .then((json: unknown) =>
            {
                if(cancelled || !Array.isArray(json)) return;
                const parsed: { gender: GenderKey; figure: string }[] = [];
                for(const entry of json as Record<string, unknown>[])
                {
                    const rawGender = typeof entry._gender === 'string' ? entry._gender.toUpperCase() : '';
                    const figure = typeof entry._figure === 'string' ? entry._figure : '';
                    if((rawGender !== 'M' && rawGender !== 'F') || !figure) continue;
                    parsed.push({ gender: rawGender as GenderKey, figure });
                }
                if(parsed.length) setHotLooks(parsed);
            })
            .catch(() => { });
        return () => { cancelled = true; };
    }, [ step, hotLooks.length ]);

    const applyLook = useCallback((figure: string, lookGender: GenderKey) =>
    {
        const next: FigureSelection = {};
        for(const setPart of figure.split('.'))
        {
            const bits = setPart.split('-');
            if(bits.length < 2) continue;
            const setType = bits[0];
            const partId = parseInt(bits[1], 10);
            if(!setType || Number.isNaN(partId)) continue;
            const colors: number[] = [];
            for(let i = 2; i < bits.length; i++)
            {
                const c = parseInt(bits[i], 10);
                if(!Number.isNaN(c)) colors.push(c);
            }
            next[setType] = { partId, colors };
        }

        for(const setType of PART_ROWS)
        {
            if(!next[setType]) next[setType] = { ...FALLBACK_DEFAULTS[lookGender][setType] };
        }
        setGender(lookGender);
        setSelection(next);
    }, []);

    const cycleHotLook = useCallback(() =>
    {
        if(!hotLooks.length) return;
        const nextIdx = (hotLookIndex + 1) % hotLooks.length;
        setHotLookIndex(nextIdx);
        const look = hotLooks[nextIdx];
        applyLook(look.figure, look.gender);
    }, [ hotLooks, hotLookIndex, applyLook ]);

    const credentialsValid =
        EMAIL_REGEX.test(email.trim()) &&
        password.length >= 8 &&
        password === confirm;

    const handleCredentialsNext = async (event: FormEvent<HTMLFormElement>) =>
    {
        event.preventDefault();
        setLocalError(null);

        if(!email.trim() || !password || !confirm)
        {
            setLocalError(t('nitro.login.error.missing_fields', 'Please fill in every field.'));
            return;
        }
        if(!EMAIL_REGEX.test(email.trim()))
        {
            setLocalError(t('nitro.login.error.invalid_email', 'Please enter a valid email address.'));
            return;
        }
        if(password.length < 8)
        {
            setLocalError(t('nitro.login.error.password_too_short', 'Your password must be at least 8 characters.'));
            return;
        }
        if(password !== confirm)
        {
            setLocalError(t('nitro.login.error.password_mismatch', 'Passwords do not match.'));
            return;
        }

        setChecking(true);
        try
        {
            const serverOk = await pingServer();
            if(!serverOk)
            {
                setLocalError(t('nitro.login.error.server_offline', 'The gameserver is not running. Please try again later.'));
                return;
            }
            const result = await onCheckEmail(email.trim());
            if(!result.available)
            {
                setLocalError(result.error || t('nitro.login.error.email_taken', 'This email is already in use.'));
                return;
            }
            setStep('avatar');
        }
        finally
        {
            setChecking(false);
        }
    };

    const applyGender = (newGender: GenderKey) =>
    {
        setGender(newGender);
        setSelection({ ...FALLBACK_DEFAULTS[newGender] });
        setHotLookIndex(-1);
    };

    const getPartList = useCallback((setType: string): number[] =>
    {
        const loaded = partOptions[setType]?.[gender];
        if(loaded && loaded.length) return loaded;
        const fallback = FALLBACK_DEFAULTS[gender][setType]?.partId;
        return fallback !== undefined ? [ fallback ] : [];
    }, [ partOptions, gender ]);

    const getColorList = useCallback((setType: string): number[] =>
    {
        const loaded = paletteOptions[setType];
        if(loaded && loaded.length) return loaded.map(c => c.id);
        const fallback = FALLBACK_DEFAULTS[gender][setType]?.colors?.[0];
        return fallback !== undefined ? [ fallback ] : [];
    }, [ paletteOptions, gender ]);

    const cyclePart = (setType: string, direction: 1 | -1) =>
    {
        const options = getPartList(setType);
        if(!options.length) return;
        const current = selection[setType]?.partId ?? options[0];
        const idx = options.indexOf(current);
        const nextIdx = ((idx === -1 ? 0 : idx) + direction + options.length) % options.length;
        const colors = getColorList(setType);
        setSelection(prev => ({
            ...prev,
            [setType]: {
                partId: options[nextIdx],
                colors: prev[setType]?.colors ?? [ colors[0] ?? 0 ]
            }
        }));
    };

    const cycleColor = (setType: string, direction: 1 | -1) =>
    {
        const colors = getColorList(setType);
        if(!colors.length) return;
        const currentColor = selection[setType]?.colors?.[0] ?? colors[0];
        const idx = colors.indexOf(currentColor);
        const nextIdx = ((idx === -1 ? 0 : idx) + direction + colors.length) % colors.length;
        const parts = getPartList(setType);
        setSelection(prev => ({
            ...prev,
            [setType]: {
                partId: prev[setType]?.partId ?? parts[0],
                colors: [ colors[nextIdx] ]
            }
        }));
    };

    const figure = buildFigureString(selection);
    const previewSrc = buildImagingUrl(imagingUrl, figure, gender);

    const handleAvatarSubmit = async (event: FormEvent<HTMLFormElement>) =>
    {
        event.preventDefault();
        setLocalError(null);

        const trimmed = username.trim();
        if(!trimmed)
        {
            setLocalError(t('nitro.login.error.missing_username', 'Please choose a Habbo name.'));
            return;
        }
        if(trimmed.length < 3 || trimmed.length > 16)
        {
            setLocalError(t('nitro.login.error.username_length', 'Habbo name must be 3–16 characters.'));
            return;
        }

        if(turnstileEnabled && !turnstileToken)
        {
            setLocalError(t('nitro.login.error.turnstile', 'Please complete the security check.'));
            return;
        }

        setChecking(true);
        try
        {
            const serverOk = await pingServer();
            if(!serverOk)
            {
                setLocalError(t('nitro.login.error.server_offline', 'The gameserver is not running. Please try again later.'));
                return;
            }
            const result = await onCheckUsername(trimmed);
            if(!result.available)
            {
                setLocalError(result.error || t('nitro.login.error.username_taken', 'This Habbo name is already taken.'));
                return;
            }
        }
        finally
        {
            setChecking(false);
        }

        setStep('room');
    };

    const submitRegistration = (templateId: number | null) =>
    {
        onSubmit({
            username: username.trim(),
            email: email.trim(),
            password,
            figure,
            gender,
            turnstileToken,
            templateId
        }, resetWidget);
    };

    const handleRoomSubmit = (event: FormEvent<HTMLFormElement>) =>
    {
        event.preventDefault();
        setLocalError(null);
        submitRegistration(selectedTemplateId);
    };

    const busy = submitting || checking || pingingServer;
    const serverOffline = serverReachable === false;

    return (
        <div className="nitro-login-modal">
            <div className={ `dialog ${ step === 'avatar' ? 'dialog-avatar' : '' } ${ step === 'room' ? 'dialog-room' : '' }` }>
                <div className="nitro-login-card">
                    <div className="card-title">
                        <span>{ t('nitro.login.register.title', 'Habbo Details') }</span>
                        <span className="nitro-card-close-button" role="button" aria-label={ t('generic.close', 'Close') } onClick={ onCancel } />
                    </div>

                    { step === 'credentials' &&
                        <form className="card-body" onSubmit={ handleCredentialsNext } autoComplete="on">
                            <div className="register-intro">
                                { t('nitro.login.register.intro.credentials', 'Let\'s create your account. Enter your email and pick a password — we\'ll check that email isn\'t already in use.') }
                            </div>
                            { serverOffline &&
                                <div className="error-line server-offline">
                                    { t('nitro.login.server.offline.long', 'The gameserver isn\'t running right now, so new accounts can\'t be created. Please try again in a moment.') }
                                    <button type="button" className="retry-link" onClick={ pingServer } disabled={ pingingServer }>
                                        { pingingServer ? t('nitro.login.server.checking', 'Checking…') : t('nitro.login.server.retry', 'Retry') }
                                    </button>
                                </div>
                            }
                            <div className="field">
                                <label htmlFor="register-email">{ t('register.email', 'Email') }</label>
                                <input id="register-email" type="email" maxLength={ 120 } autoComplete="email"
                                    value={ email } onChange={ e => setEmail(e.target.value) } />
                            </div>
                            <div className="field">
                                <label htmlFor="register-password">{ t('generic.password', 'Password') }</label>
                                <input id="register-password" type="password" maxLength={ 128 } autoComplete="new-password"
                                    value={ password } onChange={ e => setPassword(e.target.value) } />
                            </div>
                            <div className="field">
                                <label htmlFor="register-confirm">{ t('nitro.login.register.confirm.label', 'Confirm password') }</label>
                                <input id="register-confirm" type="password" maxLength={ 128 } autoComplete="new-password"
                                    value={ confirm } onChange={ e => setConfirm(e.target.value) } />
                            </div>
                            { (localError || error) && <div className="error-line">{ localError || error }</div> }
                            { info && <div className="info-line">{ info }</div> }
                            <div className="step-footer">
                                <span className="step-indicator">1/3</span>
                                <button type="submit" className="ok-button" disabled={ !credentialsValid || busy || serverOffline }>
                                    { checking || pingingServer ? t('nitro.login.server.checking', 'Checking…') : t('nitro.login.register.next', 'Next') }
                                </button>
                            </div>
                        </form>
                    }

                    { step === 'avatar' &&
                        <form className="card-body" onSubmit={ handleAvatarSubmit } autoComplete="on">
                            <div className="register-intro">
                                { t('nitro.login.register.intro.avatar', 'Now it\'s time to make your own Habbo character! To make your own Habbo, please start by choosing your Habbo Name.') }
                            </div>
                            { serverOffline &&
                                <div className="error-line server-offline">
                                    { t('nitro.login.server.offline.long', 'The gameserver isn\'t running right now, so new accounts can\'t be created. Please try again in a moment.') }
                                    <button type="button" className="retry-link" onClick={ pingServer } disabled={ pingingServer }>
                                        { pingingServer ? t('nitro.login.server.checking', 'Checking…') : t('nitro.login.server.retry', 'Retry') }
                                    </button>
                                </div>
                            }
                            <div className="field">
                                <input id="register-username" type="text" maxLength={ 16 } autoComplete="username" placeholder={ t('nitro.login.register.username.placeholder', 'HabboName') }
                                    value={ username } onChange={ e => setUsername(e.target.value) } />
                            </div>

                            <div className="gender-row">
                                <label>
                                    <input type="radio" name="register-gender" checked={ gender === 'F' } onChange={ () => applyGender('F') } />
                                    <span>{ t('avatareditor.generic.girl', 'Girl') }</span>
                                </label>
                                <label>
                                    <input type="radio" name="register-gender" checked={ gender === 'M' } onChange={ () => applyGender('M') } />
                                    <span>{ t('avatareditor.generic.boy', 'Boy') }</span>
                                </label>
                            </div>

                            <div className="avatar-builder">
                                <div className="avatar-part-col">
                                    { PART_ROWS.map(setType => {
                                        const partPreviewSrc = buildPartPreviewUrl(imagingUrl, setType, selection, gender);
                                        return (
                                            <div className="avatar-part-row" key={ `part-${ setType }` }>
                                                <button type="button" className="arrow-btn" aria-label={ `Previous ${ setType }` }
                                                    onClick={ () => cyclePart(setType, -1) }>&lsaquo;</button>
                                                <div className={ `part-preview part-preview-${ setType }` }>
                                                    <img src={ partPreviewSrc } alt={ `${ setType } preview` } onError={ e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; } } />
                                                </div>
                                                <button type="button" className="arrow-btn" aria-label={ `Next ${ setType }` }
                                                    onClick={ () => cyclePart(setType, 1) }>&rsaquo;</button>
                                            </div>
                                        );
                                    }) }
                                </div>

                                <div className="avatar-preview">
                                    <img src={ previewSrc } alt="Habbo preview" onError={ e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; } } />
                                </div>

                                <div className="avatar-color-col">
                                    { PART_ROWS.map(setType => {
                                        const fallbackColor = FALLBACK_DEFAULTS[gender][setType]?.colors?.[0] ?? 0;
                                        const currentColor = selection[setType]?.colors?.[0] ?? fallbackColor;
                                        const swatchHex = hexFor(setType, currentColor);
                                        return (
                                            <div className="avatar-color-row" key={ `color-${ setType }` }>
                                                <button type="button" className="arrow-btn" aria-label={ `Previous color ${ setType }` }
                                                    onClick={ () => cycleColor(setType, -1) }>&lsaquo;</button>
                                                <div className="color-swatch" style={ { background: swatchHex } } />
                                                <button type="button" className="arrow-btn" aria-label={ `Next color ${ setType }` }
                                                    onClick={ () => cycleColor(setType, 1) }>&rsaquo;</button>
                                            </div>
                                        );
                                    }) }
                                </div>
                            </div>

                            <div className="hot-looks-row">
                                <button type="button" className="ok-button hot-looks-button"
                                    onClick={ cycleHotLook }
                                    disabled={ !hotLooks.length || busy }
                                    title={ hotLooks.length
                                        ? t('nitro.login.register.hotlooks.count', '%count% looks available', [ 'count' ], [ String(hotLooks.length) ])
                                        : t('nitro.login.register.hotlooks.none', 'No hot looks loaded') }>
                                    { t('avatareditor.category.hotlooks', 'Hot Looks') }{ hotLookIndex >= 0 && hotLooks.length ? ` (${ hotLookIndex + 1 }/${ hotLooks.length })` : '' }
                                </button>
                            </div>

                            { turnstileEnabled &&
                                <TurnstileWidget
                                    siteKey={ turnstileSiteKey }
                                    size="compact"
                                    onToken={ setTurnstileToken }
                                    onExpire={ () => setTurnstileToken('') }
                                    onError={ () => setTurnstileToken('') }
                                    resetSignal={ resetSignal }
                                /> }
                            { (localError || error) && <div className="error-line">{ localError || error }</div> }
                            { info && <div className="info-line">{ info }</div> }

                            <div className="step-footer step-footer-split">
                                <button type="button" className="ok-button back-button" onClick={ () => setStep('credentials') } disabled={ busy }>{ t('generic.back', 'Back') }</button>
                                <span className="step-indicator">2/3</span>
                                <button type="submit" className="ok-button" disabled={ !username.trim() || busy || serverOffline }>
                                    { (checking || pingingServer) ? t('nitro.login.server.checking', 'Checking…') : t('nitro.login.register.next', 'Next') }
                                </button>
                            </div>
                        </form>
                    }

                    { step === 'room' &&
                        <form className="card-body" onSubmit={ handleRoomSubmit } autoComplete="off">
                            <div className="register-intro">
                                { t('nitro.login.register.intro.room', 'Last step — pick a starter room, or skip and create your own later.') }
                            </div>
                            { serverOffline &&
                                <div className="error-line server-offline">
                                    { t('nitro.login.server.offline.long', 'The gameserver isn\'t running right now, so new accounts can\'t be created. Please try again in a moment.') }
                                    <button type="button" className="retry-link" onClick={ pingServer } disabled={ pingingServer }>
                                        { pingingServer ? t('nitro.login.server.checking', 'Checking…') : t('nitro.login.server.retry', 'Retry') }
                                    </button>
                                </div>
                            }

                            <div className="room-templates-list">
                                <label className={ `room-template-option room-template-skip ${ selectedTemplateId === null ? 'selected' : '' }` }>
                                    <input type="radio" name="register-room-template" checked={ selectedTemplateId === null }
                                        onChange={ () => setSelectedTemplateId(null) } />
                                    <div className="room-template-body">
                                        <div className="room-template-title">{ t('nitro.login.register.room.skip.title', 'I\'m okay — I\'ll create my own rooms') }</div>
                                        <div className="room-template-description">{ t('nitro.login.register.room.skip.description', 'Skip for now and start with an empty hotel inventory.') }</div>
                                    </div>
                                </label>

                                { roomTemplates === null && <div className="info-line">{ t('nitro.login.register.room.loading', 'Loading rooms…') }</div> }

                                { roomTemplates !== null && roomTemplates.map(template => (
                                    <label key={ template.templateId }
                                        className={ `room-template-option ${ selectedTemplateId === template.templateId ? 'selected' : '' }` }>
                                        <input type="radio" name="register-room-template" checked={ selectedTemplateId === template.templateId }
                                            onChange={ () => setSelectedTemplateId(template.templateId) } />
                                        { template.thumbnail &&
                                            <img className="room-template-thumb" src={ template.thumbnail } alt={ template.title }
                                                onError={ e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; } } /> }
                                        <div className="room-template-body">
                                            <div className="room-template-title">{ template.title }</div>
                                            { template.description &&
                                                <div className="room-template-description">{ template.description }</div> }
                                        </div>
                                    </label>
                                )) }
                            </div>

                            { roomTemplatesError && <div className="error-line">{ roomTemplatesError }</div> }
                            { (localError || error) && <div className="error-line">{ localError || error }</div> }
                            { info && <div className="info-line">{ info }</div> }

                            <div className="step-footer step-footer-split">
                                <button type="button" className="ok-button back-button" onClick={ () => setStep('avatar') } disabled={ busy }>{ t('generic.back', 'Back') }</button>
                                <span className="step-indicator">3/3</span>
                                <button type="submit" className="ok-button" disabled={ busy || serverOffline }>
                                    { submitting ? t('nitro.login.register.creating', 'Creating…') : t('nitro.login.register.finish', 'Finish') }
                                </button>
                            </div>
                        </form>
                    }
                </div>
            </div>
        </div>
    );
};


interface ForgotDialogProps extends DialogSharedProps
{
    onSubmit: (body: { email: string; turnstileToken: string; }, onDialogReset: () => void) => void;
}

const ForgotDialog: FC<ForgotDialogProps> = props =>
{
    const { onCancel, onSubmit, submitting, error, info, turnstileEnabled, turnstileSiteKey } = props;
    const [ email, setEmail ] = useState('');
    const [ localError, setLocalError ] = useState<string | null>(null);
    const [ turnstileToken, setTurnstileToken ] = useState('');
    const [ resetSignal, setResetSignal ] = useState(0);

    const resetWidget = useCallback(() =>
    {
        setTurnstileToken('');
        setResetSignal(prev => prev + 1);
    }, []);

    const handle = (event: FormEvent<HTMLFormElement>) =>
    {
        event.preventDefault();
        setLocalError(null);

        if(!email.trim())
        {
            setLocalError(t('nitro.login.error.missing_email', 'Please enter your email address.'));
            return;
        }

        onSubmit({ email: email.trim(), turnstileToken }, resetWidget);
    };

    return (
        <div className="nitro-login-modal">
            <div className="dialog">
                <div className="nitro-login-card">
                    <div className="card-title">
                        <span>{ t('nitro.login.forgot.title', 'Reset password') }</span>
                        <span className="nitro-card-close-button" role="button" aria-label={ t('generic.close', 'Close') } onClick={ onCancel } />
                    </div>
                    <form className="card-body" onSubmit={ handle } autoComplete="on">
                        <div className="field">
                            <label htmlFor="forgot-email">{ t('nitro.login.forgot.email.label', 'Email address') }</label>
                            <input id="forgot-email" type="email" maxLength={ 120 } autoComplete="email"
                                value={ email } onChange={ e => setEmail(e.target.value) } />
                        </div>
                        { turnstileEnabled &&
                            <TurnstileWidget
                                siteKey={ turnstileSiteKey }
                                size="compact"
                                onToken={ setTurnstileToken }
                                onExpire={ () => setTurnstileToken('') }
                                onError={ () => setTurnstileToken('') }
                                resetSignal={ resetSignal }
                            /> }
                        { (localError || error) && <div className="error-line">{ localError || error }</div> }
                        { info && <div className="info-line">{ info }</div> }
                        <div className="submit-row">
                            <button type="submit" className="ok-button" disabled={ submitting }>{ t('nitro.login.forgot.send', 'Send email') }</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
