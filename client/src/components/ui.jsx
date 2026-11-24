import { useEffect, useId, useRef, useState } from 'react';
import { Link, useBlocker } from 'react-router-dom';
import { ArrowRight, Check, ImagePlus, LoaderCircle, X } from 'lucide-react';
import { imageUrl } from '../lib/api';
import { IMAGE_TYPES, validateImage } from '../lib/utils';

export function Button({
  children,
  busy,
  variant = 'primary',
  className = '',
  ...props
}) {
  return (
    <button
      className={`button button-${variant} ${className}`}
      disabled={busy || props.disabled}
      {...props}
      aria-busy={busy || undefined}
    >
      <span className={busy ? 'invisible' : 'inline-flex items-center gap-2'}>
        {children}
      </span>
      {busy && (
        <LoaderCircle
          className="button-spinner animate-spin"
          size={18}
          aria-label="Working"
        />
      )}
    </button>
  );
}

export function Field({
  label,
  name,
  error,
  help,
  multiline,
  children,
  ...props
}) {
  const [showPass, setShowPass] = useState(false);
  const autoId = useId();
  const id = props.id || autoId;
  const isPass = props.type === 'password';

  const sharedProps = {
    ...props,
    name,
    id,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : help ? `${id}-help` : undefined,
    className: `input ${isPass ? 'pr-20' : ''}`,
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        {children ||
          (multiline ? (
            <textarea {...sharedProps} className="input resize-y" />
          ) : (
            <input
              {...sharedProps}
              type={isPass && showPass ? 'text' : props.type || 'text'}
            />
          ))}
        {isPass && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : (
        help && (
          <p id={`${id}-help`} className="field-help">
            {help}
          </p>
        )
      )}
    </div>
  );
}

export function ErrorBox({ message, retry }) {
  if (!message) return null;
  return (
    <div className="error-box" role="alert">
      <p>{message}</p>
      {retry && (
        <button type="button" className="text-link mt-2" onClick={retry}>
          Retry <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

export function Loading({ label = 'Loading content…' }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle size={24} className="animate-spin text-emerald-700" />
      <span>{label}</span>
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <span className="empty-mark" aria-hidden="true">
        ✦
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Picture({ filename, alt = '', className = '', ...props }) {
  const [broken, setBroken] = useState('');
  return filename && broken !== filename ? (
    <img
      src={imageUrl(filename)}
      alt={alt}
      className={className}
      onError={() => setBroken(filename)}
      {...props}
    />
  ) : (
    <div className={`image-fallback ${className}`}>
      <span aria-hidden="true">Inkwell</span>
    </div>
  );
}

export function Avatar({ user, size = 'normal' }) {
  return (
    <span className={`avatar avatar-${size}`}>
      {user?.avatar ? (
        <Picture filename={user.avatar} alt={user?.name || ''} />
      ) : (
        (user?.name || 'U').slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
  busy = false,
  actions,
}) {
  const dialogRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!open || !el) return;
    el.showModal();
    cancelBtnRef.current?.focus();
    return () => el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="modal-content">
        <h2 id={titleId}>{title}</h2>
        <div className="modal-description">{children}</div>
      </div>
      <div className="modal-actions">
        <button
          ref={cancelBtnRef}
          type="button"
          className="button button-secondary"
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </button>
        {actions}
      </div>
    </dialog>
  );
}

export function UnsavedChanges({ dirty }) {
  const blocker = useBlocker(dirty);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  return (
    <Modal
      open={blocker.state === 'blocked'}
      title="Discard unsaved changes?"
      onClose={() => blocker.reset?.()}
      actions={
        <Button variant="danger" onClick={() => blocker.proceed?.()}>
          Leave page
        </Button>
      }
    >
      <p>You have unsaved edits that will be lost if you leave now.</p>
    </Modal>
  );
}

export function ImageUpload({
  label,
  name,
  file,
  onChange,
  existing,
  limit,
  error,
  disabled,
}) {
  const id = useId();
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const [localErr, setLocalErr] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    if (previewRef.current) previewRef.current.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function handleFiles(fileList) {
    if (disabled || !fileList?.length) return;
    const errText =
      fileList.length > 1
        ? 'Please upload a single image file.'
        : validateImage(fileList[0], limit);
    setLocalErr(errText);
    if (!errText) onChange(fileList[0]);
  }

  const activeError = localErr || error;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        {file ? (
          <img
            ref={previewRef}
            alt="Preview"
            className="upload-preview"
          />
        ) : existing ? (
          <Picture
            filename={existing}
            alt="Current cover"
            className="upload-preview"
          />
        ) : (
          <ImagePlus size={30} className="mx-auto text-emerald-700" />
        )}
        <p className="font-medium text-stone-800">
          {file
            ? file.name
            : existing
              ? 'Select a new image to replace'
              : 'Upload an image file'}
        </p>
        <p className="field-help">
          JPG, PNG, WebP, GIF (Max {limit === 500000 ? '500 KB' : '2 MB'})
        </p>
        <input
          ref={fileInputRef}
          id={id}
          name={name}
          type="file"
          className="sr-only"
          accept={IMAGE_TYPES.join(',')}
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          Browse file
        </Button>
        {file && (
          <button
            type="button"
            className="text-link mx-auto mt-2"
            disabled={disabled}
            onClick={() => {
              onChange(null);
              setLocalErr('');
            }}
          >
            <X size={14} /> Clear image
          </button>
        )}
      </div>
      {activeError && (
        <p className="field-error" role="alert">
          {activeError}
        </p>
      )}
    </div>
  );
}

export function UploadProgress({ progress, onCancel }) {
  return (
    <div className="upload-progress" role="status">
      <div className="flex justify-between text-sm mb-1">
        <span>
          {progress >= 100 ? 'Processing on server…' : `Uploading ${progress}%`}
        </span>
        <button type="button" className="text-link" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <progress value={progress} max="100" className="w-full" />
    </div>
  );
}

export function SavedMessage({ children }) {
  return (
    <p className="success-message" role="status">
      <Check size={16} />
      {children}
    </p>
  );
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}