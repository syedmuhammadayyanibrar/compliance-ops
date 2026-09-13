import os
from pathlib import Path
from typing import Dict, Any, List, Optional
import httpx

class GitHubClient:
    def __init__(self, token: Optional[str] = None, local_repo_root: Optional[str] = None):
        self.token = token or os.getenv("GITHUB_TOKEN")
        self.local_repo_root = Path(local_repo_root or os.getenv("LOCAL_REPO_ROOT") or "data/golden_demo/customer-support-ai")
        self.api_base = "https://api.github.com"

    async def search(self, query: str, repo: str = "customer-support-ai") -> List[Dict[str, Any]]:
        """
        Searches repository for files matching query or semantic topic.
        Falls back to scanning local repository if token is absent or API is unreachable.
        """
        results = []
        if self.token:
            try:
                headers = {
                    "Authorization": f"Bearer {self.token}",
                    "Accept": "application/vnd.github.v3+json"
                }
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(
                        f"{self.api_base}/search/code?q={query}+repo:{repo}",
                        headers=headers
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        for item in data.get("items", []):
                            results.append({
                                "path": item.get("path"),
                                "name": item.get("name"),
                                "repository": repo,
                                "html_url": item.get("html_url")
                            })
                        return results
            except Exception as e:
                print(f"[GitHub Client] API search error: {e}. Falling back to local scanner.")

        # Local repo fallback / MCP mock
        if self.local_repo_root.exists():
            terms = [t.lower().strip() for t in query.split() if len(t) > 2]
            for file_path in self.local_repo_root.rglob("*"):
                if file_path.is_file() and not file_path.name.startswith("."):
                    rel_path = file_path.relative_to(self.local_repo_root).as_posix()
                    try:
                        content = file_path.read_text(encoding="utf-8", errors="ignore")
                    except Exception:
                        continue
                    
                    matched = False
                    if any(term in rel_path.lower() for term in terms):
                        matched = True
                    elif any(term in content.lower() for term in terms):
                        matched = True
                    elif not terms:
                        matched = True

                    if matched:
                        results.append({
                            "path": rel_path,
                            "name": file_path.name,
                            "repository": repo,
                            "size": file_path.stat().st_size
                        })
        return results

    async def get_file(self, path: str, repo: str = "customer-support-ai") -> Dict[str, Any]:
        """
        Retrieves file content and metadata.
        """
        if self.token:
            try:
                headers = {
                    "Authorization": f"Bearer {self.token}",
                    "Accept": "application/vnd.github.v3.raw"
                }
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(
                        f"{self.api_base}/repos/{repo}/contents/{path}",
                        headers=headers
                    )
                    if resp.status_code == 200:
                        return {
                            "path": path,
                            "repository": repo,
                            "content": resp.text,
                            "source": "github_api"
                        }
            except Exception as e:
                print(f"[GitHub Client] API get_file error: {e}. Falling back to local file.")

        local_file = self.local_repo_root / path
        if local_file.exists() and local_file.is_file():
            content = local_file.read_text(encoding="utf-8", errors="ignore")
            return {
                "path": path,
                "repository": repo,
                "content": content,
                "source": "local_git_repo"
            }
        
        raise FileNotFoundError(f"File {path} not found in repository {repo}")
