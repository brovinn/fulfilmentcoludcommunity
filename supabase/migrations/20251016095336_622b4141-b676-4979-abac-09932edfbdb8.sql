-- Grant admin privileges to brendonmupini6@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('d850ac74-e46b-4807-b462-dac3347d32ec', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;