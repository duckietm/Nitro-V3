import { AddLinkEventTracker, GetSessionDataManager, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { FaArrowLeft, FaCheckCircle, FaChevronRight, FaEnvelope, FaExclamationTriangle, FaEye, FaEyeSlash, FaIdBadge, FaInfoCircle, FaKey, FaShieldAlt, FaUserCog } from 'react-icons/fa';
import { GetConfigurationValue, LocalizeText, getAccessToken } from '../../api';
import { Button, LayoutAvatarImageView, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

const USERNAME_RE = /^[A-Za-z0-9._-]{3,25}$/;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 25;

type FeedbackKind = 'error' | 'success';
type Section = 'menu' | 'password' | 'email' | 'username';

const passwordStrength = (value: string): { score: number; labelKey: string; color: string } =>
{
    if(!value) return { score: 0, labelKey: '', color: 'bg-black/10' };

    let score = 0;
    if(value.length >= MIN_PASSWORD_LENGTH) score++;
    if(value.length >= 12) score++;
    if(/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if(/\d/.test(value)) score++;
    if(/[^A-Za-z0-9]/.test(value)) score++;

    if(score <= 1) return { score: 1, labelKey: 'usersettings.strength.weak', color: 'bg-[#a81a12]' };
    if(score === 2) return { score: 2, labelKey: 'usersettings.strength.fair', color: 'bg-[#ffc107]' };
    if(score === 3) return { score: 3, labelKey: 'usersettings.strength.good', color: 'bg-[#1e7295]' };
    return { score: 4, labelKey: 'usersettings.strength.strong', color: 'bg-[#00800b]' };
};

export const UserAccountSettingsView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ section, setSection ] = useState<Section>('menu');
    const [ currentPassword, setCurrentPassword ] = useState('');
    const [ newPassword, setNewPassword ] = useState('');
    const [ confirmPassword, setConfirmPassword ] = useState('');
    const [ showCurrent, setShowCurrent ] = useState(false);
    const [ showNew, setShowNew ] = useState(false);
    const [ emailCurrentPassword, setEmailCurrentPassword ] = useState('');
    const [ newEmail, setNewEmail ] = useState('');
    const [ showEmailPassword, setShowEmailPassword ] = useState(false);
    const [ usernameCurrentPassword, setUsernameCurrentPassword ] = useState('');
    const [ newUsername, setNewUsername ] = useState('');
    const [ showUsernamePassword, setShowUsernamePassword ] = useState(false);
    const [ submitting, setSubmitting ] = useState(false);
    const [ feedback, setFeedback ] = useState<{ kind: FeedbackKind; message: string } | null>(null);

    const session = useMemo(() =>
    {
        try
        {
            const manager = GetSessionDataManager();
            return {
                username: manager?.userName ?? '',
                figure: manager?.figure ?? ''
            };
        }
        catch
        {
            return { username: '', figure: '' };
        }
    }, [ isVisible ]);

    const strength = useMemo(() => passwordStrength(newPassword), [ newPassword ]);

    const resetForm = () =>
    {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrent(false);
        setShowNew(false);
        setEmailCurrentPassword('');
        setNewEmail('');
        setShowEmailPassword(false);
        setUsernameCurrentPassword('');
        setNewUsername('');
        setShowUsernamePassword(false);
        setFeedback(null);
    };

    const close = () =>
    {
        setIsVisible(false);
        setSection('menu');
        resetForm();
        setSubmitting(false);
    };

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        close();
                        return;
                    case 'toggle':
                        setIsVisible(prev => !prev);
                        return;
                }
            },
            eventUrlPrefix: 'user-account-settings/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    const submitPasswordChange = async () =>
    {
        if(submitting) return;

        setFeedback(null);

        if(!currentPassword || !newPassword || !confirmPassword)
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.fields_required') });
            return;
        }

        if(newPassword.length < MIN_PASSWORD_LENGTH)
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.password_min', [ 'count' ], [ MIN_PASSWORD_LENGTH.toString() ]) });
            return;
        }

        if(newPassword.length > MAX_PASSWORD_LENGTH)
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.password_long') });
            return;
        }

        if(newPassword !== confirmPassword)
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.password_mismatch') });
            return;
        }

        if(newPassword === currentPassword)
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.password_same') });
            return;
        }

        const token = getAccessToken();
        if(!token)
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.not_authenticated') });
            return;
        }

        const endpoint = GetConfigurationValue<string>('account.change-password.endpoint', '/api/auth/change-password');

        setSubmitting(true);
        try
        {
            const response = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${ token }`,
                    'X-Requested-With': 'NitroUserAccountSettings'
                },
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
            });

            let payload: Record<string, unknown> = {};
            try { payload = await response.json(); }
            catch {}

            if(!response.ok)
            {
                const message = typeof payload.error === 'string' && payload.error
                    ? payload.error
                    : LocalizeText('usersettings.error.request_failed', [ 'status' ], [ response.status.toString() ]);
                setFeedback({ kind: 'error', message });
                return;
            }

            const message = typeof payload.message === 'string' && payload.message
                ? payload.message
                : LocalizeText('usersettings.success.password');
            setFeedback({ kind: 'success', message });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowCurrent(false);
            setShowNew(false);
        }
        catch
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.network') });
        }
        finally
        {
            setSubmitting(false);
        }
    };

    const submitEmailChange = async () =>
    {
        if(submitting) return;

        setFeedback(null);

        if(!emailCurrentPassword || !newEmail)
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.fields_required') });
            return;
        }

        if(newEmail.length > MAX_EMAIL_LENGTH)
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.email_long') });
            return;
        }

        if(!EMAIL_RE.test(newEmail))
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.email_invalid') });
            return;
        }

        const token = getAccessToken();
        if(!token)
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.not_authenticated') });
            return;
        }

        const endpoint = GetConfigurationValue<string>('account.change-email.endpoint', '/api/auth/change-email');

        setSubmitting(true);
        try
        {
            const response = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${ token }`,
                    'X-Requested-With': 'NitroUserAccountSettings'
                },
                body: JSON.stringify({ currentPassword: emailCurrentPassword, newEmail })
            });

            let payload: Record<string, unknown> = {};
            try { payload = await response.json(); }
            catch {}

            if(!response.ok)
            {
                const message = typeof payload.error === 'string' && payload.error
                    ? payload.error
                    : LocalizeText('usersettings.error.request_failed', [ 'status' ], [ response.status.toString() ]);
                setFeedback({ kind: 'error', message });
                return;
            }

            const message = typeof payload.message === 'string' && payload.message
                ? payload.message
                : LocalizeText('usersettings.success.email');
            setFeedback({ kind: 'success', message });
            setEmailCurrentPassword('');
            setNewEmail('');
            setShowEmailPassword(false);
        }
        catch
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.network') });
        }
        finally
        {
            setSubmitting(false);
        }
    };

    const submitUsernameChange = async () =>
    {
        if(submitting) return;

        setFeedback(null);

        if(!usernameCurrentPassword || !newUsername)
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.fields_required') });
            return;
        }

        if(newUsername.length < MIN_USERNAME_LENGTH || newUsername.length > MAX_USERNAME_LENGTH)
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.username_length', [ 'min', 'max' ], [ MIN_USERNAME_LENGTH.toString(), MAX_USERNAME_LENGTH.toString() ]) });
            return;
        }

        if(!USERNAME_RE.test(newUsername))
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.username_invalid') });
            return;
        }

        if(newUsername === session.username)
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.username_same') });
            return;
        }

        const token = getAccessToken();
        if(!token)
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.not_authenticated') });
            return;
        }

        const endpoint = GetConfigurationValue<string>('account.change-username.endpoint', '/api/auth/change-username');

        setSubmitting(true);
        try
        {
            const response = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${ token }`,
                    'X-Requested-With': 'NitroUserAccountSettings'
                },
                body: JSON.stringify({ currentPassword: usernameCurrentPassword, newUsername })
            });

            let payload: Record<string, unknown> = {};
            try { payload = await response.json(); }
            catch {}

            if(!response.ok)
            {
                const message = typeof payload.error === 'string' && payload.error
                    ? payload.error
                    : LocalizeText('usersettings.error.request_failed', [ 'status' ], [ response.status.toString() ]);
                setFeedback({ kind: 'error', message });
                return;
            }

            const message = typeof payload.message === 'string' && payload.message
                ? payload.message
                : LocalizeText('usersettings.success.username');
            setFeedback({ kind: 'success', message });
            setUsernameCurrentPassword('');
            setNewUsername('');
            setShowUsernamePassword(false);

            // The server has dropped our session — clear local credentials and bounce
            // the user back to the login screen so the whole client reloads cleanly.
            try { window.localStorage.removeItem('nitro.access.token'); } catch {}
            try { window.localStorage.removeItem('nitro.access.token.exp'); } catch {}
            window.setTimeout(() =>
            {
                try { window.location.reload(); }
                catch {}
            }, 2500);
        }
        catch
        {
            setFeedback({ kind: 'error', message: LocalizeText('usersettings.error.network') });
        }
        finally
        {
            setSubmitting(false);
        }
    };

    if(!isVisible) return null;

    return (
        <NitroCardView className="user-account-settings-window w-[360px]" theme="primary-slim" uniqueKey="user-account-settings">
            <NitroCardHeaderView headerText={ LocalizeText('usersettings.title') } onCloseClick={ close } />

            <div className="relative flex items-center gap-3 px-3 py-2 bg-[linear-gradient(180deg,#2e8fb8_0%,#1e7295_100%)] text-white">
                <div className="absolute inset-0 opacity-20 pointer-events-none [background-image:radial-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:6px_6px]" />
                { session.figure && (
                    <div className="relative w-[60px] h-[60px] shrink-0 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden">
                        <LayoutAvatarImageView
                            figure={ session.figure }
                            direction={ 2 }
                            headOnly={ true }
                            scale={ 1 }
                            style={ { backgroundSize: '112px auto', backgroundPosition: '-24px -38px' } }
                        />
                    </div>
                ) }
                <div className="relative flex flex-col leading-tight">
                    <Text small className="text-white/80 uppercase tracking-wider">{ LocalizeText('usersettings.account.label') }</Text>
                    <Text bold className="text-white text-[15px]">{ session.username || LocalizeText('usersettings.guest') }</Text>
                    <Text small className="text-white/80">{ LocalizeText('usersettings.subtitle') }</Text>
                </div>
            </div>

            <NitroCardContentView className="flex flex-col gap-2 text-black">
                { section === 'menu' && (
                    <div className="flex flex-col gap-2">
                        <Text small className="text-black/60 uppercase tracking-wider px-1">{ LocalizeText('usersettings.menu.section') }</Text>
                        <button
                            type="button"
                            className="group flex items-center gap-3 rounded-md border border-black/10 bg-white px-3 py-2 hover:bg-[#f5fbfd] hover:border-[#1e7295] transition-colors cursor-pointer text-left"
                            onClick={ () => { resetForm(); setSection('password'); } }>
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1e7295] text-white shrink-0 shadow-[inset_0_2px_#ffffff26,inset_0_-2px_#0000001a]">
                                <FaKey />
                            </div>
                            <div className="flex flex-col flex-1 leading-tight">
                                <Text bold>{ LocalizeText('usersettings.menu.password.title') }</Text>
                                <Text small className="text-black/60">{ LocalizeText('usersettings.menu.password.desc') }</Text>
                            </div>
                            <FaChevronRight className="text-black/40 group-hover:text-[#1e7295]" />
                        </button>

                        <button
                            type="button"
                            className="group flex items-center gap-3 rounded-md border border-black/10 bg-white px-3 py-2 hover:bg-[#f5fbfd] hover:border-[#1e7295] transition-colors cursor-pointer text-left"
                            onClick={ () => { resetForm(); setSection('email'); } }>
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#185d79] text-white shrink-0 shadow-[inset_0_2px_#ffffff26,inset_0_-2px_#0000001a]">
                                <FaEnvelope />
                            </div>
                            <div className="flex flex-col flex-1 leading-tight">
                                <Text bold>{ LocalizeText('usersettings.menu.email.title') }</Text>
                                <Text small className="text-black/60">{ LocalizeText('usersettings.menu.email.desc') }</Text>
                            </div>
                            <FaChevronRight className="text-black/40 group-hover:text-[#1e7295]" />
                        </button>

                        <button
                            type="button"
                            className="group flex items-center gap-3 rounded-md border border-black/10 bg-white px-3 py-2 hover:bg-[#fef7e0] hover:border-[#ffc107] transition-colors cursor-pointer text-left"
                            onClick={ () => { resetForm(); setSection('username'); } }>
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#ffc107] text-[#5c4400] shrink-0 shadow-[inset_0_2px_#ffffff80,inset_0_-2px_#0000001a]">
                                <FaIdBadge />
                            </div>
                            <div className="flex flex-col flex-1 leading-tight">
                                <Text bold>{ LocalizeText('usersettings.menu.username.title') }</Text>
                                <Text small className="text-black/60">{ LocalizeText('usersettings.menu.username.desc') }</Text>
                            </div>
                            <FaChevronRight className="text-black/40 group-hover:text-[#a37800]" />
                        </button>

                        <div className="flex items-center gap-3 rounded-md border border-dashed border-black/15 bg-black/[0.02] px-3 py-2 opacity-70">
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-black/10 text-black/40 shrink-0">
                                <FaShieldAlt />
                            </div>
                            <div className="flex flex-col flex-1 leading-tight">
                                <Text bold className="text-black/60">{ LocalizeText('usersettings.menu.soon.title') }</Text>
                                <Text small className="text-black/50">{ LocalizeText('usersettings.menu.soon.desc') }</Text>
                            </div>
                        </div>
                    </div>
                ) }

                { section === 'password' && (
                    <div className="flex flex-col gap-2" onKeyDown={ (event: KeyboardEvent<HTMLDivElement>) => { if(event.key === 'Enter') { event.preventDefault(); submitPasswordChange(); } } }>
                        <div className="flex items-center gap-2 -mt-1 mb-1">
                            <button
                                type="button"
                                disabled={ submitting }
                                onClick={ () => { resetForm(); setSection('menu'); } }
                                className="flex items-center justify-center w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 text-black/70 disabled:opacity-50">
                                <FaArrowLeft size={ 11 } />
                            </button>
                            <FaUserCog className="text-[#1e7295]" />
                            <Text bold>{ LocalizeText('usersettings.menu.password.title') }</Text>
                        </div>

                        <div className="flex items-start gap-2 rounded-md border border-[#1e7295]/30 bg-[#1e7295]/10 px-2 py-2 text-[11px] leading-4 text-[#0d3d52]">
                            <FaInfoCircle className="mt-[2px] shrink-0 text-[#1e7295]" />
                            <span>{ LocalizeText('usersettings.password.hint', [ 'count' ], [ MIN_PASSWORD_LENGTH.toString() ]) }</span>
                        </div>

                        <label className="flex flex-col gap-1 text-[12px]">
                            <span className="font-bold">{ LocalizeText('usersettings.field.current_password') }</span>
                            <div className="relative flex items-center">
                                <FaKey className="absolute left-2 text-black/40" size={ 12 } />
                                <input
                                    type={ showCurrent ? 'text' : 'password' }
                                    className="w-full rounded border border-black/20 bg-white pl-7 pr-8 py-1 focus:border-[#1e7295] focus:outline-none"
                                    autoComplete="current-password"
                                    maxLength={ MAX_PASSWORD_LENGTH }
                                    value={ currentPassword }
                                    onChange={ event => setCurrentPassword(event.target.value) }
                                    disabled={ submitting }
                                />
                                <button
                                    type="button"
                                    aria-label={ showCurrent ? LocalizeText('usersettings.aria.hide_password') : LocalizeText('usersettings.aria.show_password') }
                                    onClick={ () => setShowCurrent(prev => !prev) }
                                    className="absolute right-2 text-black/40 hover:text-black/70">
                                    { showCurrent ? <FaEyeSlash size={ 12 } /> : <FaEye size={ 12 } /> }
                                </button>
                            </div>
                        </label>

                        <label className="flex flex-col gap-1 text-[12px]">
                            <span className="font-bold">{ LocalizeText('usersettings.field.new_password') }</span>
                            <div className="relative flex items-center">
                                <FaKey className="absolute left-2 text-black/40" size={ 12 } />
                                <input
                                    type={ showNew ? 'text' : 'password' }
                                    className="w-full rounded border border-black/20 bg-white pl-7 pr-8 py-1 focus:border-[#1e7295] focus:outline-none"
                                    autoComplete="new-password"
                                    maxLength={ MAX_PASSWORD_LENGTH }
                                    value={ newPassword }
                                    onChange={ event => setNewPassword(event.target.value) }
                                    disabled={ submitting }
                                />
                                <button
                                    type="button"
                                    aria-label={ showNew ? LocalizeText('usersettings.aria.hide_password') : LocalizeText('usersettings.aria.show_password') }
                                    onClick={ () => setShowNew(prev => !prev) }
                                    className="absolute right-2 text-black/40 hover:text-black/70">
                                    { showNew ? <FaEyeSlash size={ 12 } /> : <FaEye size={ 12 } /> }
                                </button>
                            </div>
                            { newPassword.length > 0 && (
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
                                        <div className={ `h-full ${ strength.color } transition-all` } style={ { width: `${ (strength.score / 4) * 100 }%` } } />
                                    </div>
                                    <span className="text-[10px] text-black/60 w-12 text-right">{ strength.labelKey ? LocalizeText(strength.labelKey) : '' }</span>
                                </div>
                            ) }
                        </label>

                        <label className="flex flex-col gap-1 text-[12px]">
                            <span className="font-bold">{ LocalizeText('usersettings.field.retype_password') }</span>
                            <div className="relative flex items-center">
                                <FaKey className="absolute left-2 text-black/40" size={ 12 } />
                                <input
                                    type={ showNew ? 'text' : 'password' }
                                    className={ `w-full rounded border bg-white pl-7 pr-8 py-1 focus:outline-none ${ confirmPassword.length > 0 && confirmPassword !== newPassword ? 'border-[#a81a12] focus:border-[#a81a12]' : 'border-black/20 focus:border-[#1e7295]' }` }
                                    autoComplete="new-password"
                                    maxLength={ MAX_PASSWORD_LENGTH }
                                    value={ confirmPassword }
                                    onChange={ event => setConfirmPassword(event.target.value) }
                                    disabled={ submitting }
                                />
                                { confirmPassword.length > 0 && confirmPassword === newPassword && (
                                    <FaCheckCircle className="absolute right-2 text-[#00800b]" size={ 12 } />
                                ) }
                            </div>
                        </label>

                        { feedback && (
                            <div className={ `flex items-start gap-2 rounded-md border px-2 py-2 text-[11px] leading-4 ${ feedback.kind === 'error' ? 'border-[#a81a12]/40 bg-[#a81a12]/10 text-[#7a1109]' : 'border-[#00800b]/40 bg-[#00800b]/10 text-[#005407]' }` }>
                                { feedback.kind === 'error'
                                    ? <FaExclamationTriangle className="mt-[2px] shrink-0" />
                                    : <FaCheckCircle className="mt-[2px] shrink-0" /> }
                                <span>{ feedback.message }</span>
                            </div>
                        ) }

                        <div className="flex justify-end gap-2 pt-1">
                            <Button variant="secondary" disabled={ submitting } onClick={ () => { resetForm(); setSection('menu'); } }>
                                { LocalizeText('usersettings.btn.cancel') }
                            </Button>
                            <Button variant="success" disabled={ submitting } onClick={ () => submitPasswordChange() }>
                                { submitting ? LocalizeText('usersettings.btn.saving') : LocalizeText('usersettings.btn.save_password') }
                            </Button>
                        </div>
                    </div>
                ) }

                { section === 'email' && (
                    <div className="flex flex-col gap-2" onKeyDown={ (event: KeyboardEvent<HTMLDivElement>) => { if(event.key === 'Enter') { event.preventDefault(); submitEmailChange(); } } }>
                        <div className="flex items-center gap-2 -mt-1 mb-1">
                            <button
                                type="button"
                                disabled={ submitting }
                                onClick={ () => { resetForm(); setSection('menu'); } }
                                className="flex items-center justify-center w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 text-black/70 disabled:opacity-50">
                                <FaArrowLeft size={ 11 } />
                            </button>
                            <FaEnvelope className="text-[#185d79]" />
                            <Text bold>{ LocalizeText('usersettings.menu.email.title') }</Text>
                        </div>

                        <div className="flex items-start gap-2 rounded-md border border-[#1e7295]/30 bg-[#1e7295]/10 px-2 py-2 text-[11px] leading-4 text-[#0d3d52]">
                            <FaInfoCircle className="mt-[2px] shrink-0 text-[#1e7295]" />
                            <span>{ LocalizeText('usersettings.email.hint') }</span>
                        </div>

                        <label className="flex flex-col gap-1 text-[12px]">
                            <span className="font-bold">{ LocalizeText('usersettings.field.current_password') }</span>
                            <div className="relative flex items-center">
                                <FaKey className="absolute left-2 text-black/40" size={ 12 } />
                                <input
                                    type={ showEmailPassword ? 'text' : 'password' }
                                    className="w-full rounded border border-black/20 bg-white pl-7 pr-8 py-1 focus:border-[#1e7295] focus:outline-none"
                                    autoComplete="current-password"
                                    maxLength={ MAX_PASSWORD_LENGTH }
                                    value={ emailCurrentPassword }
                                    onChange={ event => setEmailCurrentPassword(event.target.value) }
                                    disabled={ submitting }
                                />
                                <button
                                    type="button"
                                    aria-label={ showEmailPassword ? LocalizeText('usersettings.aria.hide_password') : LocalizeText('usersettings.aria.show_password') }
                                    onClick={ () => setShowEmailPassword(prev => !prev) }
                                    className="absolute right-2 text-black/40 hover:text-black/70">
                                    { showEmailPassword ? <FaEyeSlash size={ 12 } /> : <FaEye size={ 12 } /> }
                                </button>
                            </div>
                        </label>

                        <label className="flex flex-col gap-1 text-[12px]">
                            <span className="font-bold">{ LocalizeText('usersettings.field.new_email') }</span>
                            <div className="relative flex items-center">
                                <FaEnvelope className="absolute left-2 text-black/40" size={ 12 } />
                                <input
                                    type="email"
                                    className={ `w-full rounded border bg-white pl-7 pr-8 py-1 focus:outline-none ${ newEmail.length > 0 && !EMAIL_RE.test(newEmail) ? 'border-[#a81a12] focus:border-[#a81a12]' : 'border-black/20 focus:border-[#1e7295]' }` }
                                    autoComplete="email"
                                    inputMode="email"
                                    maxLength={ MAX_EMAIL_LENGTH }
                                    value={ newEmail }
                                    onChange={ event => setNewEmail(event.target.value) }
                                    disabled={ submitting }
                                    placeholder="you@example.com"
                                />
                                { newEmail.length > 0 && EMAIL_RE.test(newEmail) && (
                                    <FaCheckCircle className="absolute right-2 text-[#00800b]" size={ 12 } />
                                ) }
                            </div>
                        </label>

                        { feedback && (
                            <div className={ `flex items-start gap-2 rounded-md border px-2 py-2 text-[11px] leading-4 ${ feedback.kind === 'error' ? 'border-[#a81a12]/40 bg-[#a81a12]/10 text-[#7a1109]' : 'border-[#00800b]/40 bg-[#00800b]/10 text-[#005407]' }` }>
                                { feedback.kind === 'error'
                                    ? <FaExclamationTriangle className="mt-[2px] shrink-0" />
                                    : <FaCheckCircle className="mt-[2px] shrink-0" /> }
                                <span>{ feedback.message }</span>
                            </div>
                        ) }

                        <div className="flex justify-end gap-2 pt-1">
                            <Button variant="secondary" disabled={ submitting } onClick={ () => { resetForm(); setSection('menu'); } }>
                                { LocalizeText('usersettings.btn.cancel') }
                            </Button>
                            <Button variant="success" disabled={ submitting } onClick={ () => submitEmailChange() }>
                                { submitting ? LocalizeText('usersettings.btn.saving') : LocalizeText('usersettings.btn.save_email') }
                            </Button>
                        </div>
                    </div>
                ) }

                { section === 'username' && (
                    <div className="flex flex-col gap-2" onKeyDown={ (event: KeyboardEvent<HTMLDivElement>) => { if(event.key === 'Enter') { event.preventDefault(); submitUsernameChange(); } } }>
                        <div className="flex items-center gap-2 -mt-1 mb-1">
                            <button
                                type="button"
                                disabled={ submitting }
                                onClick={ () => { resetForm(); setSection('menu'); } }
                                className="flex items-center justify-center w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 text-black/70 disabled:opacity-50">
                                <FaArrowLeft size={ 11 } />
                            </button>
                            <FaIdBadge className="text-[#a37800]" />
                            <Text bold>{ LocalizeText('usersettings.menu.username.title') }</Text>
                        </div>

                        <div className="flex items-start gap-2 rounded-md border border-[#ffc107]/50 bg-[#fff8e1] px-2 py-2 text-[11px] leading-4 text-[#5c4400]">
                            <FaExclamationTriangle className="mt-[2px] shrink-0 text-[#a37800]" />
                            <span>{ LocalizeText('usersettings.username.hint') }</span>
                        </div>

                        <label className="flex flex-col gap-1 text-[12px]">
                            <span className="font-bold">{ LocalizeText('usersettings.field.current_password') }</span>
                            <div className="relative flex items-center">
                                <FaKey className="absolute left-2 text-black/40" size={ 12 } />
                                <input
                                    type={ showUsernamePassword ? 'text' : 'password' }
                                    className="w-full rounded border border-black/20 bg-white pl-7 pr-8 py-1 focus:border-[#1e7295] focus:outline-none"
                                    autoComplete="current-password"
                                    maxLength={ MAX_PASSWORD_LENGTH }
                                    value={ usernameCurrentPassword }
                                    onChange={ event => setUsernameCurrentPassword(event.target.value) }
                                    disabled={ submitting }
                                />
                                <button
                                    type="button"
                                    aria-label={ showUsernamePassword ? LocalizeText('usersettings.aria.hide_password') : LocalizeText('usersettings.aria.show_password') }
                                    onClick={ () => setShowUsernamePassword(prev => !prev) }
                                    className="absolute right-2 text-black/40 hover:text-black/70">
                                    { showUsernamePassword ? <FaEyeSlash size={ 12 } /> : <FaEye size={ 12 } /> }
                                </button>
                            </div>
                        </label>

                        <label className="flex flex-col gap-1 text-[12px]">
                            <span className="font-bold">{ LocalizeText('usersettings.field.new_username') }</span>
                            <div className="relative flex items-center">
                                <FaIdBadge className="absolute left-2 text-black/40" size={ 12 } />
                                <input
                                    type="text"
                                    className={ `w-full rounded border bg-white pl-7 pr-8 py-1 focus:outline-none ${ newUsername.length > 0 && (!USERNAME_RE.test(newUsername) || newUsername === session.username) ? 'border-[#a81a12] focus:border-[#a81a12]' : 'border-black/20 focus:border-[#1e7295]' }` }
                                    autoComplete="off"
                                    spellCheck={ false }
                                    maxLength={ MAX_USERNAME_LENGTH }
                                    value={ newUsername }
                                    onChange={ event => setNewUsername(event.target.value) }
                                    disabled={ submitting }
                                    placeholder="NewName"
                                />
                                { newUsername.length > 0 && USERNAME_RE.test(newUsername) && newUsername !== session.username && (
                                    <FaCheckCircle className="absolute right-2 text-[#00800b]" size={ 12 } />
                                ) }
                            </div>
                            <span className="text-[10px] text-black/50">{ LocalizeText('usersettings.username.rules', [ 'min', 'max' ], [ MIN_USERNAME_LENGTH.toString(), MAX_USERNAME_LENGTH.toString() ]) }</span>
                        </label>

                        { feedback && (
                            <div className={ `flex items-start gap-2 rounded-md border px-2 py-2 text-[11px] leading-4 ${ feedback.kind === 'error' ? 'border-[#a81a12]/40 bg-[#a81a12]/10 text-[#7a1109]' : 'border-[#00800b]/40 bg-[#00800b]/10 text-[#005407]' }` }>
                                { feedback.kind === 'error'
                                    ? <FaExclamationTriangle className="mt-[2px] shrink-0" />
                                    : <FaCheckCircle className="mt-[2px] shrink-0" /> }
                                <span>{ feedback.message }</span>
                            </div>
                        ) }

                        <div className="flex justify-end gap-2 pt-1">
                            <Button variant="secondary" disabled={ submitting } onClick={ () => { resetForm(); setSection('menu'); } }>
                                { LocalizeText('usersettings.btn.cancel') }
                            </Button>
                            <Button variant="warning" disabled={ submitting } onClick={ () => submitUsernameChange() }>
                                { submitting ? LocalizeText('usersettings.btn.renaming') : LocalizeText('usersettings.btn.rename') }
                            </Button>
                        </div>
                    </div>
                ) }
            </NitroCardContentView>
        </NitroCardView>
    );
};
