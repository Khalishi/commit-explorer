import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { GitHubRepository, GitHubCommit, GitHubCommitDetail } from '../types/github'

// Use vi.hoisted() to create mocks that can be accessed in both the mock factory and tests
const { mockGet } = vi.hoisted(() => {
  return {
    mockGet: vi.fn(),
  }
})

// Mock axios before importing the module
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: mockGet,
  }
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: vi.fn((error: any) => error?.isAxiosError === true),
    },
  }
})

// Import after mocking
import { githubApi } from './githubApi'

describe('githubApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRepositories', () => {
    it('should fetch repositories correctly for a given username', async () => {
      const username = 'octocat'
      const mockRepositories: GitHubRepository[] = [
        {
          id: 1,
          name: 'Hello-World',
          full_name: 'octocat/Hello-World',
          owner: {
            login: 'octocat',
            avatar_url: 'https://github.com/images/error/octocat_happy.gif',
            html_url: 'https://github.com/octocat',
          },
          description: 'This your first repo!',
          html_url: 'https://github.com/octocat/Hello-World',
          stargazers_count: 80,
          forks_count: 9,
          language: 'JavaScript',
          created_at: '2011-01-26T19:01:12Z',
          updated_at: '2011-01-26T19:14:43Z',
          pushed_at: '2011-01-26T19:06:43Z',
          default_branch: 'master',
        },
        {
          id: 2,
          name: 'Spoon-Knife',
          full_name: 'octocat/Spoon-Knife',
          owner: {
            login: 'octocat',
            avatar_url: 'https://github.com/images/error/octocat_happy.gif',
            html_url: 'https://github.com/octocat',
          },
          description: 'This repo is for demonstration purposes only.',
          html_url: 'https://github.com/octocat/Spoon-Knife',
          stargazers_count: 115,
          forks_count: 122,
          language: 'HTML',
          created_at: '2011-01-27T19:30:43Z',
          updated_at: '2011-01-27T19:30:43Z',
          pushed_at: '2011-01-27T19:30:43Z',
          default_branch: 'master',
        },
      ]

      mockGet.mockResolvedValue({ data: mockRepositories })

      const result = await githubApi.getRepositories(username)

      // Verify the correct endpoint was called
      expect(mockGet).toHaveBeenCalledWith(`/users/${username}/repos`)
      expect(result).toEqual(mockRepositories)
      expect(result).toHaveLength(2)
      expect(result[0]?.name).toBe('Hello-World')
      expect(result[1]?.name).toBe('Spoon-Knife')
    })

    it('should handle 404 error when user is not found', async () => {
      const username = 'nonexistent-user'
      mockGet.mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Not Found' },
        },
        isAxiosError: true,
      })

      await expect(githubApi.getRepositories(username)).rejects.toThrow(
        `User "${username}" not found`
      )
    })

    it('should handle other API errors', async () => {
      const username = 'octocat'
      mockGet.mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
        isAxiosError: true,
      })

      await expect(githubApi.getRepositories(username)).rejects.toThrow(
        'Internal Server Error'
      )
    })
  })

  describe('getCommits', () => {
    it('should fetch commits correctly for a given repository', async () => {
      const username = 'octocat'
      const repo = 'Hello-World'
      const mockCommits: GitHubCommit[] = [
        {
          sha: '6dcb09b5b57875f334f61aebed695e2e4193db5e',
          commit: {
            message: 'Fix all the bugs',
            author: {
              name: 'Monalisa Octocat',
              email: 'octocat@github.com',
              date: '2011-04-14T16:00:49Z',
            },
            committer: {
              name: 'Monalisa Octocat',
              email: 'octocat@github.com',
              date: '2011-04-14T16:00:49Z',
            },
          },
          author: {
            login: 'octocat',
            avatar_url: 'https://github.com/images/error/octocat_happy.gif',
            html_url: 'https://github.com/octocat',
          },
          committer: {
            login: 'octocat',
            avatar_url: 'https://github.com/images/error/octocat_happy.gif',
            html_url: 'https://github.com/octocat',
          },
          html_url: 'https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e',
          parents: [
            {
              sha: '6dcb09b5b57875f334f61aebed695e2e4193db5e',
              html_url: 'https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e',
            },
          ],
        },
        {
          sha: '7638417db6d59f3c431d3e1f261cc637155684cd',
          commit: {
            message: 'Initial commit',
            author: {
              name: 'Scott Chacon',
              email: 'schacon@gmail.com',
              date: '2011-04-14T16:00:49Z',
            },
            committer: {
              name: 'Scott Chacon',
              email: 'schacon@gmail.com',
              date: '2011-04-14T16:00:49Z',
            },
          },
          author: {
            login: 'schacon',
            avatar_url: 'https://github.com/images/error/schacon_happy.gif',
            html_url: 'https://github.com/schacon',
          },
          committer: {
            login: 'schacon',
            avatar_url: 'https://github.com/images/error/schacon_happy.gif',
            html_url: 'https://github.com/schacon',
          },
          html_url: 'https://github.com/octocat/Hello-World/commit/7638417db6d59f3c431d3e1f261cc637155684cd',
          parents: [],
        },
      ]

      mockGet.mockResolvedValue({ data: mockCommits })

      const result = await githubApi.getCommits(username, repo)

      // Verify the correct endpoint was called with default pagination
      expect(mockGet).toHaveBeenCalledWith(
        `/repos/${username}/${repo}/commits`,
        {
          params: {
            per_page: 30,
            page: 1,
          },
        }
      )
      expect(result).toEqual(mockCommits)
      expect(result).toHaveLength(2)
      expect(result[0]?.sha).toBe('6dcb09b5b57875f334f61aebed695e2e4193db5e')
      expect(result[0]?.commit.message).toBe('Fix all the bugs')
    })

    it('should fetch commits with custom pagination parameters', async () => {
      const username = 'octocat'
      const repo = 'Hello-World'
      const perPage = 50
      const page = 2
      const mockCommits: GitHubCommit[] = []

      mockGet.mockResolvedValue({ data: mockCommits })

      const result = await githubApi.getCommits(username, repo, perPage, page)

      // Verify the correct endpoint was called with custom pagination
      expect(mockGet).toHaveBeenCalledWith(
        `/repos/${username}/${repo}/commits`,
        {
          params: {
            per_page: 50,
            page: 2,
          },
        }
      )
      expect(result).toEqual(mockCommits)
    })

    it('should cap per_page at 100 (GitHub API limit)', async () => {
      const username = 'octocat'
      const repo = 'Hello-World'
      const perPage = 150 // Should be capped at 100
      const mockCommits: GitHubCommit[] = []

      mockGet.mockResolvedValue({ data: mockCommits })

      await githubApi.getCommits(username, repo, perPage)

      // Verify per_page is capped at 100
      expect(mockGet).toHaveBeenCalledWith(
        `/repos/${username}/${repo}/commits`,
        {
          params: {
            per_page: 100,
            page: 1,
          },
        }
      )
    })

    it('should handle 404 error when repository is not found', async () => {
      const username = 'octocat'
      const repo = 'nonexistent-repo'
      mockGet.mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Not Found' },
        },
        isAxiosError: true,
      })

      await expect(githubApi.getCommits(username, repo)).rejects.toThrow(
        `Repository "${username}/${repo}" not found`
      )
    })

    it('should handle other API errors when fetching commits', async () => {
      const username = 'octocat'
      const repo = 'Hello-World'
      mockGet.mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
        isAxiosError: true,
      })

      await expect(githubApi.getCommits(username, repo)).rejects.toThrow(
        'Internal Server Error'
      )
    })
  })

  describe('getCommitDetails', () => {
    it('should fetch commit details correctly for a given commit SHA', async () => {
      const username = 'octocat'
      const repo = 'Hello-World'
      const sha = '6dcb09b5b57875f334f61aebed695e2e4193db5e'
      const mockCommitDetail: GitHubCommitDetail = {
        sha: '6dcb09b5b57875f334f61aebed695e2e4193db5e',
        commit: {
          message: 'Fix all the bugs',
          author: {
            name: 'Monalisa Octocat',
            email: 'octocat@github.com',
            date: '2011-04-14T16:00:49Z',
          },
          committer: {
            name: 'Monalisa Octocat',
            email: 'octocat@github.com',
            date: '2011-04-14T16:00:49Z',
          },
        },
        author: {
          login: 'octocat',
          avatar_url: 'https://github.com/images/error/octocat_happy.gif',
          html_url: 'https://github.com/octocat',
        },
        committer: {
          login: 'octocat',
          avatar_url: 'https://github.com/images/error/octocat_happy.gif',
          html_url: 'https://github.com/octocat',
        },
        html_url: 'https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e',
        parents: [
          {
            sha: '6dcb09b5b57875f334f61aebed695e2e4193db5e',
            html_url: 'https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e',
          },
        ],
        stats: {
          total: 108,
          additions: 80,
          deletions: 28,
        },
        files: [
          {
            filename: 'file1.txt',
            status: 'added',
            additions: 103,
            deletions: 21,
            changes: 124,
            patch: '@@ -132,7 +132,7 @@ module Test @@\n-test\n+test',
          },
          {
            filename: 'file2.txt',
            status: 'modified',
            additions: 5,
            deletions: 3,
            changes: 8,
          },
        ],
      }

      mockGet.mockResolvedValue({ data: mockCommitDetail })

      const result = await githubApi.getCommitDetails(username, repo, sha)

      // Verify the correct endpoint was called
      expect(mockGet).toHaveBeenCalledWith(
        `/repos/${username}/${repo}/commits/${sha}`
      )
      expect(result).toEqual(mockCommitDetail)
      expect(result.sha).toBe(sha)
      expect(result.stats).toBeDefined()
      expect(result.stats.total).toBe(108)
      expect(result.stats.additions).toBe(80)
      expect(result.stats.deletions).toBe(28)
      expect(result.files).toBeDefined()
      expect(result.files).toHaveLength(2)
      expect(result.files[0]?.filename).toBe('file1.txt')
      expect(result.files[1]?.filename).toBe('file2.txt')
    })

    it('should handle 404 error when commit is not found', async () => {
      const username = 'octocat'
      const repo = 'Hello-World'
      const sha = 'invalid-sha'
      mockGet.mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Not Found' },
        },
        isAxiosError: true,
      })

      await expect(githubApi.getCommitDetails(username, repo, sha)).rejects.toThrow(
        `Commit "${sha}" not found`
      )
    })

    it('should handle other API errors when fetching commit details', async () => {
      const username = 'octocat'
      const repo = 'Hello-World'
      const sha = '6dcb09b5b57875f334f61aebed695e2e4193db5e'
      mockGet.mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
        isAxiosError: true,
      })

      await expect(githubApi.getCommitDetails(username, repo, sha)).rejects.toThrow(
        'Internal Server Error'
      )
    })
  })
})

