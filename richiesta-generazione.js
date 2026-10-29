function numeroSpuntiniRichiesto(valore) {
  const numero=valore??null;
  if(numero!==null&&(!Number.isInteger(numero)||numero<0||numero>3))throw Object.assign(new Error('numero_spuntini_non_valido'),{status:400});
  return numero;
}
module.exports={numeroSpuntiniRichiesto};
