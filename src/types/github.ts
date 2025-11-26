// GitHub API Response Types

export interface GitHubUser {
  login: string
  avatar_url: string
  html_url: string
  name: string | null
  bio: string | null
  followers: number
  following: number
  public_repos: number
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  owner: {
    login: string
    avatar_url: string
    html_url: string
  }
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  created_at: string
  updated_at: string
  pushed_at: string
  default_branch: string
}

export interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
    committer: {
      name: string
      email: string
      date: string
    }
  }
  author: {
    login: string
    avatar_url: string
    html_url: string
  } | null
  committer: {
    login: string
    avatar_url: string
    html_url: string
  } | null
  html_url: string
  parents: Array<{
    sha: string
    html_url: string
  }>
}

export interface GitHubCommitDetail extends GitHubCommit {
  stats: {
    total: number
    additions: number
    deletions: number
  }
  files: Array<{
    filename: string
    status: string
    additions: number
    deletions: number
    changes: number
    patch?: string
  }>
}

