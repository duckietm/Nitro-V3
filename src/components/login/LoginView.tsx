import { GetConfiguration } from '@nitrots/nitro-renderer';
import { FC, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GetConfigurationValue } from '../../api';
import { TurnstileWidget } from './TurnstileWidget';

type DialogMode = 'login' | 'register' | 'forgot';

const interpolate = (value: string | null | undefined): string =>
{
    if(!value) return '';
    try { return GetConfiguration().interpolate(value); }
    catch { return value; }
};

const LOCK_KEY = 'nitro.login.lock';
const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 60_000; // rolling 60s window
const LOCK_DURATION_MS = 2 * 60_000; // 2 minute lockout

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
    catch { /* ignore */ }
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
    const submitTimeRef = useRef(0);

    const loginImages: Record<string, string> = ((GetConfigurationValue<Record<string, unknown>>('loginview', {})?.['images']) as Record<string, string>) ?? {};

    const backgroundColor = (loginImages['background.colour'] || GetConfigurationValue<string>('login_background.colour', '#6eadc8'));
    const background = interpolate(loginImages['background'] || GetConfigurationValue<string>('login_background', ''));
    const sun = interpolate(loginImages['sun'] || GetConfigurationValue<string>('login_sun', ''));
    const drape = interpolate(loginImages['drape'] || GetConfigurationValue<string>('login_drape', ''));
    const left = interpolate(loginImages['left'] || GetConfigurationValue<string>('login_left', ''));
    const rightRepeat = interpolate(loginImages['right.repeat'] || GetConfigurationValue<string>('login_right.repeat', ''));
    const right = interpolate(loginImages['right'] || GetConfigurationValue<string>('login_right', ''));

    useEffect(() =>
    {
        // eslint-disable-next-line no-console
        console.info('[LoginView] resolved background assets', {
            'asset.url':            GetConfigurationValue<string>('asset.url', ''),
            login_background:       background,
            'login_background.colour': backgroundColor,
            login_sun:              sun,
            login_drape:            drape,
            login_left:             left,
            login_right:            right,
            'login_right.repeat':   rightRepeat
        });
    }, [ background, backgroundColor, sun, drape, left, right, rightRepeat ]);

    const loginUrl = GetConfigurationValue<string>('login.endpoint', '/api/auth/login');
    const registerUrl = GetConfigurationValue<string>('login.register.endpoint', '/api/auth/register');
    const forgotUrl = GetConfigurationValue<string>('login.forgot.endpoint', '/api/auth/forgot-password');
    const turnstileSiteKey = GetConfigurationValue<string>('login.turnstile.sitekey', '');
    const rawTurnstileEnabled = GetConfigurationValue<unknown>('login.turnstile.enabled', false);
    const turnstileEnabled = (rawTurnstileEnabled === true
        || rawTurnstileEnabled === 'true'
        || rawTurnstileEnabled === 1
        || rawTurnstileEnabled === '1') && !!turnstileSiteKey;

    useEffect(() =>
    {
        // eslint-disable-next-line no-console
        console.info('[LoginView] turnstile config', {
            rawTurnstileEnabled,
            turnstileEnabled,
            turnstileSiteKey: turnstileSiteKey ? (turnstileSiteKey.slice(0, 6) + '…') : '(empty)'
        });
    }, [ rawTurnstileEnabled, turnstileEnabled, turnstileSiteKey ]);

    const resetLoginTurnstile = useCallback(() =>
    {
        setLoginTurnstileToken('');
        setLoginTurnstileResetSignal(prev => prev + 1);
    }, []);

    // Clear error on mode change but keep the success notification so users
    // returning to the login form can read it (e.g. "Account created").
    // Reset the login captcha only when we're actually on the login form.
    useEffect(() =>
    {
        setError(null);
        if(mode === 'login') resetLoginTurnstile();
    }, [ mode, resetLoginTurnstile ]);

    // Auto-dismiss the info notification after a few seconds so it doesn't
    // hang around forever once the user has seen it.
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
        catch { /* ignore non-json responses */ }

        return { ok: response.ok, status: response.status, payload };
    }, []);

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
            setError(`Too many attempts. Try again in ${ remaining }s.`);
            return;
        }

        if(!username.trim() || !password)
        {
            setError('Please enter both your Habbo name and password.');
            return;
        }

        if(turnstileEnabled && !loginTurnstileToken)
        {
            setError('Please complete the security check.');
            return;
        }

        setError(null);
        setSubmitting(true);

        try
        {
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
            const message = typeof payload.error === 'string' ? payload.error : 'Invalid Habbo name or password.';
            setError(message);
            resetLoginTurnstile();
        }
        catch(err)
        {
            recordFailure();
            setError('Unable to reach the login service. Please try again.');
            resetLoginTurnstile();
        }
        finally
        {
            setSubmitting(false);
        }
    }, [ submitting, username, password, turnstileEnabled, loginTurnstileToken, loginUrl, postJson, clearLock, recordFailure, onAuthenticated, resetLoginTurnstile ]);

    // Register + forgot-password submit handlers receive the Turnstile token
    // from the dialog (the dialog owns its own widget lifecycle), so the
    // login widget underneath can't reset or overwrite it while the user
    // is working on the modal.

    const handleRegisterSubmit = useCallback(async (body: { username: string; email: string; password: string; turnstileToken: string; }, onDialogReset: () => void) =>
    {
        if(turnstileEnabled && !body.turnstileToken)
        {
            setError('Please complete the security check.');
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
                turnstileToken: turnstileEnabled ? body.turnstileToken : undefined
            });

            if(ok)
            {
                const friendly = `Welcome aboard, ${ body.username }! Your account is ready — log in below with the password you just chose.`;
                setInfo(typeof payload.message === 'string' ? payload.message : friendly);
                setMode('login');
                setUsername(body.username);
                setPassword('');
                return;
            }

            setError(typeof payload.error === 'string' ? payload.error : 'Unable to create your account.');
            onDialogReset();
        }
        catch
        {
            setError('Unable to reach the registration service.');
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
            setError('Please complete the security check.');
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
                const friendly = 'Email sent! If an account matches that address you\'ll find a reset link in your inbox shortly (check spam if it doesn\'t show up within a minute).';
                setInfo(typeof payload.message === 'string' ? payload.message : friendly);
                setMode('login');
                return;
            }

            setError(typeof payload.error === 'string' ? payload.error : 'Unable to send a reset email right now.');
            onDialogReset();
        }
        catch
        {
            setError('Unable to reach the password reset service.');
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
                    <div className="card-title">First time here?</div>
                    <div className="card-body register-card-body">
                        <span>Don't have a Habbo yet?</span>
                        <a onClick={ () => setMode('register') }>You can create one here</a>
                    </div>
                </div>

                <div className="nitro-login-card">
                    <div className="card-title">What's your Habbo called?</div>
                    <form className="card-body" onSubmit={ handleLoginSubmit } autoComplete="on">
                        <div className="field">
                            <label htmlFor="login-username">Name of your Habbo</label>
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
                            <label htmlFor="login-password">Password</label>
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
                        { error && <div className="error-line">{ error }</div> }
                        { info && <div className="info-line">{ info }</div> }
                        <div className="submit-row">
                            <button
                                type="submit"
                                className="ok-button"
                                disabled={ submitting || isLocked }
                            >OK</button>
                        </div>
                        <a className="forgot" onClick={ () => setMode('forgot') }>Forgotten your password?</a>
                    </form>
                </div>
            </div>

            { mode === 'register' &&
                <RegisterDialog
                    onCancel={ () => setMode('login') }
                    onSubmit={ handleRegisterSubmit }
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
    onSubmit: (body: { username: string; email: string; password: string; turnstileToken: string; }, onDialogReset: () => void) => void;
}

const RegisterDialog: FC<RegisterDialogProps> = props =>
{
    const { onCancel, onSubmit, submitting, error, info, turnstileEnabled, turnstileSiteKey } = props;
    const [ username, setUsername ] = useState('');
    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ confirm, setConfirm ] = useState('');
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

        if(!username.trim() || !email.trim() || !password)
        {
            setLocalError('Please fill in every field.');
            return;
        }

        if(password.length < 8)
        {
            setLocalError('Your password must be at least 8 characters.');
            return;
        }

        if(password !== confirm)
        {
            setLocalError('Passwords do not match.');
            return;
        }

        onSubmit({ username: username.trim(), email: email.trim(), password, turnstileToken }, resetWidget);
    };

    return (
        <div className="nitro-login-modal">
            <div className="dialog">
                <div className="nitro-login-card">
                    <div className="card-title">
                        <span>Create a Habbo</span>
                        <span className="nitro-card-close-button" role="button" aria-label="Close" onClick={ onCancel } />
                    </div>
                    <form className="card-body" onSubmit={ handle } autoComplete="on">
                        <div className="field">
                            <label htmlFor="register-username">Habbo name</label>
                            <input id="register-username" type="text" maxLength={ 32 } autoComplete="username"
                                value={ username } onChange={ e => setUsername(e.target.value) } />
                        </div>
                        <div className="field">
                            <label htmlFor="register-email">Email</label>
                            <input id="register-email" type="email" maxLength={ 120 } autoComplete="email"
                                value={ email } onChange={ e => setEmail(e.target.value) } />
                        </div>
                        <div className="field">
                            <label htmlFor="register-password">Password</label>
                            <input id="register-password" type="password" maxLength={ 128 } autoComplete="new-password"
                                value={ password } onChange={ e => setPassword(e.target.value) } />
                        </div>
                        <div className="field">
                            <label htmlFor="register-confirm">Confirm password</label>
                            <input id="register-confirm" type="password" maxLength={ 128 } autoComplete="new-password"
                                value={ confirm } onChange={ e => setConfirm(e.target.value) } />
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
                            <button type="submit" className="ok-button" disabled={ submitting }>Create account</button>
                        </div>
                    </form>
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
            setLocalError('Please enter your email address.');
            return;
        }

        onSubmit({ email: email.trim(), turnstileToken }, resetWidget);
    };

    return (
        <div className="nitro-login-modal">
            <div className="dialog">
                <div className="nitro-login-card">
                    <div className="card-title">
                        <span>Reset password</span>
                        <span className="nitro-card-close-button" role="button" aria-label="Close" onClick={ onCancel } />
                    </div>
                    <form className="card-body" onSubmit={ handle } autoComplete="on">
                        <div className="field">
                            <label htmlFor="forgot-email">Email address</label>
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
                            <button type="submit" className="ok-button" disabled={ submitting }>Send email</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
