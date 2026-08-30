import { computeSHA256, quickSyncHash } from "./hasher";

export interface MerkleProofStep {
  position: "left" | "right";
  hash: string;
}

export interface MerkleProof {
  leafHash: string;
  leafIndex: number;
  root: string;
  proof: MerkleProofStep[];
}

export class MerkleTree {
  private leaves: string[];
  private layers: string[][];

  constructor(leaves: string[]) {
    if (leaves.length === 0) {
      throw new Error("Cannot construct Merkle tree with 0 leaves");
    }
    this.leaves = [...leaves];
    this.layers = [this.leaves];
    this.buildTree();
  }

  private buildTree(): void {
    let currentLayer = this.leaves;

    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];

      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        // If odd number of leaves, duplicate the last leaf
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;

        // Hash parent node: SHA256(left + right)
        const combined = left < right ? `${left}${right}` : `${right}${left}`;
        const parentHash = quickSyncHash(combined);
        nextLayer.push(parentHash);
      }

      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  public getRoot(): string {
    const topLayer = this.layers[this.layers.length - 1];
    return topLayer[0];
  }

  public getProof(leafIndex: number): MerkleProof {
    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new Error(`Leaf index ${leafIndex} out of bounds`);
    }

    const proof: MerkleProofStep[] = [];
    let currentIndex = leafIndex;

    for (let layerIndex = 0; layerIndex < this.layers.length - 1; layerIndex++) {
      const layer = this.layers[layerIndex];
      const isRightChild = currentIndex % 2 === 1;
      const siblingIndex = isRightChild ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < layer.length) {
        proof.push({
          position: isRightChild ? "left" : "right",
          hash: layer[siblingIndex],
        });
      } else {
        // Duplicated self as sibling
        proof.push({
          position: "right",
          hash: layer[currentIndex],
        });
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      leafHash: this.leaves[leafIndex],
      leafIndex,
      root: this.getRoot(),
      proof,
    };
  }

  public static verifyProof(proof: MerkleProof): boolean {
    let currentHash = proof.leafHash;

    for (const step of proof.proof) {
      const combined =
        step.position === "left"
          ? (step.hash < currentHash ? `${step.hash}${currentHash}` : `${currentHash}${step.hash}`)
          : (currentHash < step.hash ? `${currentHash}${step.hash}` : `${step.hash}${currentHash}`);

      currentHash = quickSyncHash(combined);
    }

    return currentHash.toLowerCase() === proof.root.toLowerCase();
  }
}
