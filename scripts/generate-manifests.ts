#!/usr/bin/env tsx
/**
 * Manifest Generator Script
 * 
 * Reads WEBP files from frontend-2/public/people/ and generates scenario manifests
 * that map signatures to available image files.
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractSignatureFromFilename } from '../packages/signature/dist/index.js';

interface ManifestEntry {
  scenario: number;
  mapping: Record<string, string[]>;
}

function getImageFiles(imagesDir: string): string[] {
  if (!fs.existsSync(imagesDir)) {
    console.warn(`Images directory does not exist: ${imagesDir}`);
    return [];
  }
  
  return fs.readdirSync(imagesDir)
    .filter(file => file.toLowerCase().endsWith('.webp'))
    .sort();
}

function groupFilesBySignature(files: string[]): Record<string, string[]> {
  const mapping: Record<string, string[]> = {};
  
  for (const filename of files) {
    const signature = extractSignatureFromFilename(filename);
    if (!signature) {
      console.warn(`Could not extract signature from filename: ${filename}`);
      continue;
    }
    
    if (!mapping[signature]) {
      mapping[signature] = [];
    }
    mapping[signature].push(filename);
  }
  
  return mapping;
}

function detectScenarioFromSignature(signature: string): number {
  // Heuristic detection based on signature patterns
  // Scenario 3 has specific tokens: UV, I, FF, QF, VC, GS
  if (signature.includes('UV') && signature.includes('QF')) {
    return 3;
  }
  
  // TODO: Add detection for scenarios 1 and 2 based on their signature patterns
  // For now, assume scenario 1 for anything else
  return 1;
}

function generateManifest(scenario: number, mapping: Record<string, string[]>): ManifestEntry {
  return {
    scenario,
    mapping
  };
}

function writeManifest(outputDir: string, scenario: number, manifest: ManifestEntry): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filename = `scenario-${scenario}.json`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Generated: ${filepath}`);
}

function validateManifest(scenario: number, mapping: Record<string, string[]>): void {
  const signatures = Object.keys(mapping);
  const totalFiles = Object.values(mapping).reduce((sum, files) => sum + files.length, 0);
  
  console.log(`Scenario ${scenario}:`);
  console.log(`  - ${signatures.length} unique signatures`);
  console.log(`  - ${totalFiles} total image files`);
  
  // Log any signatures with only one image (might want more variety)
  const singleImageSignatures = signatures.filter(sig => mapping[sig].length === 1);
  if (singleImageSignatures.length > 0) {
    console.warn(`  - ${singleImageSignatures.length} signatures have only 1 image`);
  }
  
  // Sample a few signatures for verification
  const sampleSignatures = signatures.slice(0, 3);
  for (const sig of sampleSignatures) {
    console.log(`  - "${sig}": ${mapping[sig].length} files`);
  }
}

async function main(): Promise<void> {
  const imagesDir = path.resolve('frontend-2/public/people');
  const outputDir = path.resolve('frontend-2/public/manifest');
  
  console.log('Generating image manifests...');
  console.log(`Images directory: ${imagesDir}`);
  console.log(`Output directory: ${outputDir}`);
  
  const allFiles = getImageFiles(imagesDir);
  console.log(`Found ${allFiles.length} WEBP files`);
  
  if (allFiles.length === 0) {
    console.warn('No WEBP files found. Make sure images are in frontend-2/public/people/');
    process.exit(1);
  }
  
  // Group files by signature and then by detected scenario
  const allMapping = groupFilesBySignature(allFiles);
  const scenarioMappings: Record<number, Record<string, string[]>> = {};
  
  for (const [signature, files] of Object.entries(allMapping)) {
    const scenario = detectScenarioFromSignature(signature);
    
    if (!scenarioMappings[scenario]) {
      scenarioMappings[scenario] = {};
    }
    scenarioMappings[scenario][signature] = files;
  }
  
  // Generate manifests for each detected scenario
  for (const [scenarioStr, mapping] of Object.entries(scenarioMappings)) {
    const scenario = parseInt(scenarioStr, 10);
    validateManifest(scenario, mapping);
    
    const manifest = generateManifest(scenario, mapping);
    writeManifest(outputDir, scenario, manifest);
  }
  
  console.log('\nManifest generation complete!');
  
  // Provide guidance for missing scenarios
  const detectedScenarios = Object.keys(scenarioMappings).map(Number);
  const allScenarios = [1, 2, 3];
  const missingScenarios = allScenarios.filter(s => !detectedScenarios.includes(s));
  
  if (missingScenarios.length > 0) {
    console.warn(`\nMissing scenarios: ${missingScenarios.join(', ')}`);
    console.warn('Make sure you have generated images for all scenarios.');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error generating manifests:', error);
    process.exit(1);
  });
}
