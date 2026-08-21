-- Quita el perfil de demostración y todo lo que dependía de él.

delete from public.perfiles
where id = '00000000-0000-4000-8000-000000000001';
