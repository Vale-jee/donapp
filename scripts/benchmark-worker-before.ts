const PROCESSING_DELAY_MILLISECONDS = 1500;

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function main(): Promise<void> {
  const startedAt = performance.now();

  console.info("[benchmark-before] Iniciando procesamiento síncrono.");
  await wait(PROCESSING_DELAY_MILLISECONDS);

  const totalMilliseconds = performance.now() - startedAt;
  console.info("[benchmark-before] Procesamiento terminado.");
  console.info(
    `[benchmark-before] Tiempo total: ${totalMilliseconds.toFixed(2)} ms.`,
  );
}

void main();
