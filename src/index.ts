import * as core from "@actions/core";
import fs from "fs";
import * as github from "@actions/github";

async function getRelease(octokit: github.GitHub, tagName: string) {
  console.log("Retrieving release...");
  try {
    const release = await octokit.repos.getReleaseByTag({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      tag: tagName,
    });
    return release.data;
  } catch (e) {
    if (
      ((e.message as string) || "").toLowerCase().indexOf("not found") !== -1
    ) {
      return undefined;
    }
    throw e;
  }
}

async function createRelease(
  octokit: github.GitHub,
  tagName: string,
  releaseName: string
) {
  console.log("Not found. Creating new release...", {
    tagName,
    releaseName,
    ref: github.context.ref,
  });
  await octokit.repos.createRelease({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    tag_name: tagName,
    target_commitish: github.context.ref,
    name: releaseName,
    prerelease: true,
  });
  return getRelease(octokit, tagName);
}

async function deleteExistingAsset(
  octokit: github.GitHub,
  asset: { id: number } | undefined
) {
  if (asset) {
    console.log("Deleting previous asset...");
    await octokit.repos.deleteReleaseAsset({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      asset_id: asset.id,
    });
  }
}

async function uploadNewAsset(
  octokit: github.GitHub,
  release: { upload_url: string; id: number },
  file: string,
  assetName: string
) {
  console.log("Updating release description...");
  await octokit.repos.updateRelease({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    release_id: release.id,
    target_commitish: github.context.sha,
  });
  console.log("Uploading new asset...");
  const headers = {
    "content-type": "application/octet-stream",
    "content-length": fs.statSync(file).size,
  };
  await octokit.repos.uploadReleaseAsset({
    url: release.upload_url,
    name: assetName,
    headers,
    data: fs.readFileSync(file),
  });
}

async function main() {
  try {
    const token = core.getInput("token");
    core.setSecret(token);
    const releaseName = core.getInput("release-name");
    const tagName = core.getInput("tag-name");
    const assetName = core.getInput("asset-name");
    const file = core.getInput("file");

    if (github.context.ref.startsWith("refs/pull")) {
      console.log("::warning::Skipping action as this is a pull request");
      return;
    }

    const octokit = new github.GitHub(token);
    let release = await getRelease(octokit, tagName);
    if (!release) {
      release = await createRelease(octokit, tagName, releaseName);
      if (!release) {
        throw new Error("Could not create new release");
      }
    }
    await deleteExistingAsset(
      octokit,
      release.assets.find((_) => _.name === assetName)
    );
    await uploadNewAsset(octokit, release, file, assetName);
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
