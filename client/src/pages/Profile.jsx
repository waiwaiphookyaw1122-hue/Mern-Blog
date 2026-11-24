import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import {
  AVATAR_LIMIT,
  errorMessage,
  safeUser,
  validateImage,
} from '../lib/utils';
import { useNotice, useSession } from '../stores/session';
import { useResource } from '../hooks/useResource';
import { useForm } from '../hooks/useForm';
import {
  Avatar,
  Button,
  ErrorBox,
  Field,
  ImageUpload,
  Loading,
  PageHeading,
  UnsavedChanges,
  UploadProgress,
} from '../components/ui';

export default function Profile() {
  const userId = useSession((state) => state.user.id);
  const profileReq = useResource(`/users/${userId}`);

  if (profileReq.loading) return <Loading label="Loading account settings…" />;
  if (profileReq.error)
    return <ErrorBox message={profileReq.error} retry={profileReq.retry} />;

  return <ProfileForm initialUser={safeUser(profileReq.data)} />;
}

function ProfileForm({ initialUser }) {
  const [current, setCurrent] = useState(initialUser);
  const form = useForm({
    name: initialUser.name,
    email: initialUser.email,
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [busyMode, setBusyMode] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const abortRef = useRef(null);
  const { expired, updateUser } = useSession();
  const show = useNotice((state) => state.show);

  const isDirty = Boolean(
    avatarFile ||
      form.values.name !== current.name ||
      form.values.email !== current.email ||
      form.values.currentPassword ||
      form.values.newPassword ||
      form.values.confirmNewPassword,
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  async function handleAvatarUpload(e) {
    e.preventDefault();
    if (busyMode || expired) return;

    const validationMsg = validateImage(avatarFile, AVATAR_LIMIT);
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    setBusyMode('avatar');
    setError('');
    setProgress(0);
    abortRef.current = new AbortController();

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      const res = await api.post('/users/change-avatar', formData, {
        authenticated: true,
        signal: abortRef.current.signal,
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      });
      const updated = safeUser(res.data);
      setCurrent(updated);
      updateUser(updated);
      setAvatarFile(null);
      show('Avatar photo updated!');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyMode('');
    }
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    if (busyMode || expired) return;

    const vals = form.values;
    const validationErrors = {
      ...(!vals.name.trim() ? { name: 'Name is required.' } : {}),
      ...(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email.trim())
        ? { email: 'Valid email is required.' }
        : {}),
      ...(!vals.currentPassword
        ? { currentPassword: 'Enter your current password.' }
        : {}),
      ...(vals.newPassword.trim().length < 6
        ? { newPassword: 'New password must be at least 6 characters.' }
        : {}),
      ...(vals.confirmNewPassword !== vals.newPassword
        ? { confirmNewPassword: 'New passwords do not match.' }
        : {}),
    };

    if (!form.validate(validationErrors, e.currentTarget)) return;

    setBusyMode('profile');
    setError('');

    try {
      const { data } = await api.patch(
        '/users/edit-user',
        {
          ...vals,
          name: vals.name.trim(),
          email: vals.email.trim().toLowerCase(),
        },
        { authenticated: true },
      );
      const updated = safeUser(data);
      setCurrent(updated);
      updateUser(updated);
      form.setValues({
        name: updated.name,
        email: updated.email,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      show('Account settings updated!');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyMode('');
    }
  }

  return (
    <>
      <UnsavedChanges dirty={isDirty || Boolean(busyMode)} />
      <PageHeading
        eyebrow="Profile Management"
        title="Account Settings"
        description="Update your author avatar, display name, and security credentials."
      />

      <div className="profile-layout">
        <aside className="profile-photo">
          <Avatar user={current} size="large" />
          <h2 className="mt-3 font-bold text-lg">{current.name}</h2>
          <p className="text-sm text-stone-500 mb-6">
            {current.posts} {current.posts === 1 ? 'story' : 'stories'} published
          </p>

          <form noValidate onSubmit={handleAvatarUpload}>
            <ImageUpload
              label="Profile Photo"
              name="avatar"
              file={avatarFile}
              onChange={setAvatarFile}
              limit={AVATAR_LIMIT}
              disabled={Boolean(busyMode)}
            />
            {busyMode === 'avatar' && (
              <UploadProgress
                progress={progress}
                onCancel={() => abortRef.current?.abort()}
              />
            )}
            <Button
              type="submit"
              variant="secondary"
              busy={busyMode === 'avatar'}
              disabled={!avatarFile || Boolean(busyMode) || expired}
              className="w-full mt-2"
            >
              Save New Photo
            </Button>
          </form>
        </aside>

        <section className="profile-details">
          <h2 className="text-xl font-bold mb-2">Personal Info & Password</h2>
          <p className="text-sm text-stone-500 mb-6">
            Confirm your current password and enter a new password to save
            changes.
          </p>

          <form noValidate onSubmit={handleProfileSave}>
            <fieldset disabled={Boolean(busyMode)}>
              <Field
                label="Display Name"
                autoComplete="name"
                {...form.bind('name')}
              />
              <Field
                label="Email Address"
                type="email"
                autoComplete="email"
                {...form.bind('email')}
              />
              <hr className="my-6 border-stone-200" />
              <Field
                label="Current Password"
                type="password"
                autoComplete="current-password"
                {...form.bind('currentPassword')}
              />
              <Field
                label="New Password"
                type="password"
                autoComplete="new-password"
                help="At least 6 characters."
                {...form.bind('newPassword')}
              />
              <Field
                label="Confirm New Password"
                type="password"
                autoComplete="new-password"
                {...form.bind('confirmNewPassword')}
              />
            </fieldset>

            <Button
              type="submit"
              busy={busyMode === 'profile'}
              disabled={Boolean(busyMode) || expired}
              className="mt-4"
            >
              Update Account
            </Button>
          </form>
        </section>
      </div>
      <ErrorBox message={error} />
    </>
  );
}