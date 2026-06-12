const lines = [
  "(h3) UNIDAD DE ATENCIÓN EN SALUD: (/h3)",
  "(h3)UNIDAD DE ATENCIÓN EN SALUD:(/h3)",
  " (h3) UNIDAD DE ATENCIÓN EN SALUD: (/h3) ",
  " (h3) UNIDAD DE ATENCIÓN EN SALUD: (/h3)",
  "(h3) UNIDAD DE ATENCIÓN EN SALUD: (/h3) ",
];

lines.forEach(line => {
  let textToRender = line.trim();
  const h3Match = textToRender.match(/^\(h3\)(.*?)\(\/h3\)$/i);
  console.log(`line: '${line}', textToRender: '${textToRender}', matched: ${!!h3Match}`);
});
