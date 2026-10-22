-- Rollback di 2026-10-22-accompagnamenti-pane-patate.sql. NON ESEGUITO.
-- Cancella solo i 9 id nuovi (dish_ingredients prima, per la foreign key,
-- poi dishes - cancellare dishes farebbe comunque sparire dish_ingredients
-- in automatico per ON DELETE CASCADE, ma l'ordine esplicito resta più
-- chiaro da leggere).

delete from public.dish_ingredients where dish_id in (
  '40cc7014-35fb-4703-8e72-dd0a67d7488e', '310c3710-c4ed-44eb-930d-e9de7413d218',
  '1ea88888-90e2-4b78-9e89-6c7982e21a4e', '64be79c2-797d-45be-b728-cc9896e46c73',
  '950107bb-00a2-4b6b-9983-b01e4f8c779e', '37fa37d2-1706-42bf-b2a4-c071e6e777aa',
  '8b168db5-ea79-4fda-83b6-806d773462c5', 'e58925ab-a8f7-43c3-8363-7ae436c3a878',
  '9fd0677e-228e-4b27-a33a-f96c4247cae6'
);

delete from public.dishes where id in (
  '40cc7014-35fb-4703-8e72-dd0a67d7488e', '310c3710-c4ed-44eb-930d-e9de7413d218',
  '1ea88888-90e2-4b78-9e89-6c7982e21a4e', '64be79c2-797d-45be-b728-cc9896e46c73',
  '950107bb-00a2-4b6b-9983-b01e4f8c779e', '37fa37d2-1706-42bf-b2a4-c071e6e777aa',
  '8b168db5-ea79-4fda-83b6-806d773462c5', 'e58925ab-a8f7-43c3-8363-7ae436c3a878',
  '9fd0677e-228e-4b27-a33a-f96c4247cae6'
);
