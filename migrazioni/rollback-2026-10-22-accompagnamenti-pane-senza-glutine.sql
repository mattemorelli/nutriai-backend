-- Rollback di 2026-10-22-accompagnamenti-pane-senza-glutine.sql. NON ESEGUITO.
-- Ordine inverso rispetto alla migrazione: dish_ingredients e
-- categorie_alimenti prima (hanno una foreign key verso dishes/categorie),
-- poi dishes.

delete from public.dish_ingredients where dish_id in (
  '9560b1b7-e1d6-40f2-9331-788dee9b6208',
  'a27106fb-e60f-44c7-86f8-faa8ac121ce4',
  '0e1b7e2e-769e-4dbb-aded-fee28989712f'
);

delete from public.categorie_alimenti where categoria = 'pane' and food_id in (
  'gallette_riso_it', '167557', 'polenta_it'
);

delete from public.dishes where id in (
  '9560b1b7-e1d6-40f2-9331-788dee9b6208',
  'a27106fb-e60f-44c7-86f8-faa8ac121ce4',
  '0e1b7e2e-769e-4dbb-aded-fee28989712f'
);
