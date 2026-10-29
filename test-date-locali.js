const {test}=require('node:test'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
for(const [zona,istante,oggi,da] of [
 ['Europe/Rome','2026-10-28T23:30:00Z','2026-10-29','2026-10-01'],
 ['UTC','2026-10-28T23:30:00Z','2026-10-28','2026-09-30'],
 ['America/New_York','2026-10-29T01:30:00Z','2026-10-28','2026-09-30'],
 ['Europe/Rome','2026-03-29T22:30:00Z','2026-03-30','2026-03-02'],
 ['Europe/Rome','2028-03-01T00:30:00Z','2028-03-01','2028-02-02'],
])test('finestra civile '+zona+' '+istante,()=>{
 const code=`const {finestraCalibrazione}=require(${JSON.stringify(require.resolve('./date-locali'))});process.stdout.write(JSON.stringify(finestraCalibrazione(new Date(${JSON.stringify(istante)}))));`;
 assert.deepEqual(JSON.parse(execFileSync(process.execPath,['-e',code],{env:{...process.env,TZ:zona},encoding:'utf8'})),{oggi,da});
});
