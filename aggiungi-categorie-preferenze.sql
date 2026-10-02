-- Aggiunge 6 nuove categorie "preferenza" (funghi, olive, coriandolo,
-- frattaglie, formaggi_erborinati, piccante) per i bollini preimpostati del
-- passo 7 di Onboarding.js. Idempotente: on conflict do nothing ovunque,
-- si può rilanciare senza duplicare nulla.

BEGIN;

insert into categorie (codice, nome_it, nome_en, tipo, sinonimi) values
  ('funghi', 'Funghi', 'Mushrooms', 'preferenza', ARRAY['mushroom','mushrooms','champignon']),
  ('olive', 'Olive', 'Olives', 'preferenza', ARRAY['olive','olives']),
  ('coriandolo', 'Coriandolo', 'Coriander', 'preferenza', ARRAY['coriander','cilantro']),
  ('frattaglie', 'Frattaglie', 'Offal', 'preferenza', ARRAY['offal','organ meat','organ meats','giblets']),
  ('formaggi_erborinati', 'Formaggi erborinati', 'Blue cheese', 'preferenza', ARRAY['blue cheese']),
  ('piccante', 'Piccante', 'Spicy food', 'preferenza', ARRAY['spicy','spicy food','hot','piccante'])
on conflict (codice) do nothing;

insert into alias_categoria (alias, codice) values
  ('funghi', 'funghi'), ('mushrooms', 'funghi'), ('mushroom', 'funghi'), ('champignon', 'funghi'),
  ('olive', 'olive'), ('olives', 'olive'),
  ('coriandolo', 'coriandolo'), ('coriander', 'coriandolo'), ('cilantro', 'coriandolo'),
  ('frattaglie', 'frattaglie'), ('offal', 'frattaglie'), ('organ meat', 'frattaglie'), ('organ meats', 'frattaglie'), ('giblets', 'frattaglie'),
  ('formaggi erborinati', 'formaggi_erborinati'), ('blue cheese', 'formaggi_erborinati'),
  ('piccante', 'piccante'), ('spicy food', 'piccante'), ('spicy', 'piccante'), ('hot', 'piccante')
on conflict (alias) do nothing;

insert into categorie_alimenti (categoria, food_id) values
  ('funghi', 'funghi_champignon_it'), ('funghi', 'funghi_porcini_it'), ('funghi', 'funghi_portobello_it'), ('funghi', 'funghi_it'), ('funghi', '168434'),
  ('olive', 'olive_verdi_it'), ('olive', '169094'),
  ('coriandolo', 'coriandolo_it'),
  ('frattaglie', '169451'), ('frattaglie', '171060'), ('frattaglie', 'fegato_vitello_it'), ('frattaglie', '170196'), ('frattaglie', '169449'), ('frattaglie', '173870'),
  ('formaggi_erborinati', 'gorgonzola_it'),
  ('piccante', 'peperoncino_it'), ('piccante', 'peperoncino_jalapeno_it'), ('piccante', '168576'), ('piccante', 'gochujang_it'), ('piccante', '171319'), ('piccante', '174528'), ('piccante', 'curry_rosso_it'), ('piccante', '171186')
on conflict do nothing;

COMMIT;

select codice, nome_it, tipo from categorie
  where codice in ('funghi','olive','coriandolo','frattaglie','formaggi_erborinati','piccante') order by codice;
select categoria, count(*) from categorie_alimenti
  where categoria in ('funghi','olive','coriandolo','frattaglie','formaggi_erborinati','piccante')
  group by categoria order by categoria;
