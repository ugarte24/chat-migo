-- Cubeta privada para el APK. Solo el service role (API de admin y GitHub Actions) puede leer/escribir.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'apk',
  'apk',
  false,
  104857600,
  array['application/vnd.android.package-archive', 'application/octet-stream']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
