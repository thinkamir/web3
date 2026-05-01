const fs = require('fs');
const path = require('path');
const solc = require('solc');

const root = path.resolve(__dirname, '..');
const files = [
  'src/PrizeVault.sol',
  'src/MerkleEntryVerifier.sol',
  'src/DrawRoundManager.sol',
  'src/DrawRoundManagerVRF.sol',
];

const sources = Object.fromEntries(
  files.map((file) => [file, { content: fs.readFileSync(path.join(root, file), 'utf8') }]),
);

const input = {
  language: 'Solidity',
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    viaIR: true,
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],
      },
    },
  },
};

function findImport(importPath) {
  const candidates = [
    path.join(root, importPath),
    path.join(root, 'node_modules', importPath),
    path.join(root, 'node_modules', importPath.replace('@foundry-rs/forge-std/', 'forge-std/src/')),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { contents: fs.readFileSync(candidate, 'utf8') };
    }
  }

  return { error: `Import not found: ${importPath}` };
}

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));
const errors = output.errors || [];
for (const error of errors) {
  const line = `${error.severity.toUpperCase()}: ${error.formattedMessage}`;
  if (error.severity === 'error') {
    console.error(line);
  } else {
    console.warn(line);
  }
}

if (errors.some((error) => error.severity === 'error')) {
  process.exit(1);
}

const outDir = path.join(root, 'out');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
for (const [sourceName, contracts] of Object.entries(output.contracts || {})) {
  for (const [contractName, artifact] of Object.entries(contracts)) {
    const artifactPath = path.join(outDir, `${contractName}.json`);
    fs.writeFileSync(
      artifactPath,
      JSON.stringify({ sourceName, contractName, abi: artifact.abi, bytecode: artifact.evm.bytecode.object }, null, 2),
    );
  }
}
console.log(`Compiled ${Object.keys(output.contracts || {}).length} Solidity source files successfully.`);
