-- Permite el manifiesto latest.json en la cubeta apk (además del instalador).

update storage.buckets
set allowed_mime_types = array[
  'application/vnd.android.package-archive',
  'application/octet-stream',
  'application/json'
]
where id = 'apk';
