// Verifica il token di sessione e ricava l'identita' di chi sta chiedendo.
// Da usare come secondo argomento negli endpoint: app.get('/rotta', richiedeAuth, ...)

function creaRichiedeAuth(supabase) {
  return async function richiedeAuth(req, res, next) {
    const intestazione = req.headers.authorization || '';
    const token = intestazione.startsWith('Bearer ') ? intestazione.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ errore: 'Autenticazione richiesta' });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ errore: 'Sessione non valida o scaduta' });
    }

    req.utente = data.user;
    next();
  };
}

// Controlla che una riga appartenga a chi sta chiedendo.
// Restituisce true se puo' proseguire, false se ha gia' risposto con un errore.
async function verificaProprieta(supabase, res, tabella, id, utenteId) {
  const { data, error } = await supabase
    .from(tabella)
    .select('user_id')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    res.status(500).json({ errore: error.message });
    return false;
  }
  if (!data) {
    res.status(404).json({ errore: 'Non trovato' });
    return false;
  }
  if (data.user_id !== utenteId) {
    res.status(403).json({ errore: 'Non hai accesso a questa risorsa' });
    return false;
  }
  return true;
}

module.exports = { creaRichiedeAuth, verificaProprieta };