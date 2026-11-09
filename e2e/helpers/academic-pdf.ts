/** A synthetic two-page handout. Xref offsets are byte offsets in the generated PDF. */
export function academicPdf() {
 const pages=[
  ["Introduccion a la Gestion de Operaciones","Como se transforma una idea en un servicio","1. Identificar entradas y restricciones","2. Dibujar el flujo del proceso","3. Medir capacidad y tiempos de espera"],
  ["Procesos y capacidad","Ejercicio de la clase","Describe el proceso de atencion de una biblioteca.","Identifica el cuello de botella y compara alternativas."],
 ];
 const objects=[
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [4 0 R 6 0 R] /Count 2 >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
 ];
 for (const [index,[heading,subtitle,...lines]] of pages.entries()) {
  const next=objects.length+2;
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 680 465] /Resources << /Font << /F1 3 0 R >> >> /Contents ${next} 0 R >>`);
  const stream=[
   "0.12 0.23 0.37 rg 0 378 680 87 re f",
   "1 1 1 rg BT /F1 12 Tf 42 427 Td (ACADEMIX | GESTION DE OPERACIONES) Tj ET",
   "BT /F1 10 Tf 42 406 Td (CLASE 01  /  MATERIAL DE LECTURA) Tj ET",
   `0.12 0.23 0.37 rg BT /F1 28 Tf 42 315 Td (${heading}) Tj ET`,
   `0.27 0.33 0.41 rg BT /F1 16 Tf 42 275 Td (${subtitle}) Tj ET`,
   "0.57 0.35 0.02 rg 42 249 54 3 re f",
   ...lines.map((line,i)=>`0.12 0.23 0.37 rg BT /F1 15 Tf 42 ${206-i*38} Td (${line}) Tj ET`),
   "0.85 0.88 0.91 RG 42 65 m 638 65 l S",
   `0.27 0.33 0.41 rg BT /F1 10 Tf 42 44 Td (Material de demostracion) Tj 530 0 Td (${index+1} / 2) Tj ET`,
  ].join("\n");
  objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
 }
 let pdf="%PDF-1.7\n";
 const xref=objects.map((object,index)=>{
  const offset=Buffer.byteLength(pdf);
  pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;
  return `${String(offset).padStart(10,"0")} 00000 n \n`;
 });
 const start=Buffer.byteLength(pdf);
 return Buffer.from(pdf+`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${xref.join("")}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`);
}
