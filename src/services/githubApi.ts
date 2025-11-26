import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type { GitHubRepository, GitHubCommit, GitHubCommitDetail } from '../types/github'

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github.v3+json',
  },
})

// GitHub API Service
export const githubApi = {
  /**
   * Fetch repositories for a GitHub user
   * @param username - GitHub username
   * @returns Promise with array of repositories
   */
  async getRepositories(username: string): Promise<GitHubRepository[]> {
    try {
      const response = await apiClient.get<GitHubRepository[]>(
        `/users/${username}/repos`
      )
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`User "${username}" not found`)
        }
        throw new Error(
          error.response?.data?.message || 'Failed to fetch repositories'
        )
      }
      throw error
    }
  },

  /**
   * Fetch commits for a specific repository
   * @param username - GitHub username
   * @param repo - Repository name
   * @param perPage - Number of commits per page (default: 30, max: 100)
   * @param page - Page number (default: 1)
   * @returns Promise with array of commits
   */
  async getCommits(
    username: string,
    repo: string,
    perPage: number = 30,
    page: number = 1
  ): Promise<GitHubCommit[]> {
    try {
      const response = await apiClient.get<GitHubCommit[]>(
        `/repos/${username}/${repo}/commits`,
        {
          params: {
            per_page: Math.min(perPage, 100), // GitHub API max is 100
            page,
          },
        }
      )
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Repository "${username}/${repo}" not found`)
        }
        throw new Error(
          error.response?.data?.message || 'Failed to fetch commits'
        )
      }
      throw error
    }
  },

  /**
   * Fetch detailed information about a specific commit
   * @param username - GitHub username
   * @param repo - Repository name
   * @param sha - Commit SHA
   * @returns Promise with commit details
   */
  async getCommitDetails(
    username: string,
    repo: string,
    sha: string
  ): Promise<GitHubCommitDetail> {
    try {
      const response = await apiClient.get<GitHubCommitDetail>(
        `/repos/${username}/${repo}/commits/${sha}`
      )
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Commit "${sha}" not found`)
        }
        throw new Error(
          error.response?.data?.message || 'Failed to fetch commit details'
        )
      }
      throw error
    }
  },
}

export default githubApi

