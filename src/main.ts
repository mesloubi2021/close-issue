import * as core from '@actions/core'
import * as github from '@actions/github'
import {inspect} from 'util'

type octokitParams = {
  owner: string
  repo: string
  issue_number: number
  state: string
  state_reason: string
  labels?: string[]
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput('token'),
      repository: core.getInput('repository'),
      issueNumber: Number(core.getInput('issue-number')),
      closeReason: core.getInput('close-reason'),
      comment: core.getInput('comment'),
      labels: core.getInput('labels')
    }
    core.debug(`Inputs: ${inspect(inputs)}`)

    const [owner, repo] = inputs.repository.split('/')
    core.debug(`Repo: ${inspect(repo)}`)

    const octokit = github.getOctokit(inputs.token)

    if (inputs.comment && inputs.comment.length > 0) {
      core.info('Adding a comment before closing the issue')
      await octokit.rest.issues.createComment({
        owner: owner,
        repo: repo,
        issue_number: inputs.issueNumber,
        body: inputs.comment
      })
    }

    core.info('Closing the issue as ' + inputs.closeReason)

    const params: octokitParams = {
      owner: owner,
      repo: repo,
      issue_number: inputs.issueNumber,
      state: 'closed',
      state_reason: inputs.closeReason,
      labels: inputs.labels.split(',')
    }

    if (!params?.labels?.length) {
      delete params.labels
    }

    await octokit.rest.issues.update(params)
  } catch (error) {
    core.debug(inspect(error))
    core.setFailed(getErrorMessage(error))
  }
}

run()
