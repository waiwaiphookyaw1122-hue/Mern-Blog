import { useState } from 'react';

export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const bind = (field) => ({
    name: field,
    value: values[field] ?? '',
    error: errors[field],
    onChange: (e) => {
      const val = e.target.value;
      setValues((prev) => ({ ...prev, [field]: val }));
      setErrors((prev) => ({ ...prev, [field]: '' }));
    },
  });

  function validate(validationErrors, formElement) {
    setErrors(validationErrors);
    const firstKey = Object.keys(validationErrors).find(
      (k) => validationErrors[k],
    );
    if (firstKey && formElement) {
      requestAnimationFrame(() =>
        formElement.elements.namedItem(firstKey)?.focus(),
      );
    }
    return !firstKey;
  }

  return { values, setValues, errors, setErrors, bind, validate };
}