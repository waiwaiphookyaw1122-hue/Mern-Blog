export function postBody(values, coverFile) {
  const payload = {
    title: values.title.trim(),
    category: values.category,
    description: values.description,
  };

  if (!coverFile) return payload;

  const formData = new FormData();
  Object.entries(payload).forEach(([k, v]) => formData.append(k, v));
  formData.append('thumbnail', coverFile);
  return formData;
}