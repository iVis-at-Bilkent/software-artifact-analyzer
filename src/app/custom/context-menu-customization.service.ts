import { Injectable } from "@angular/core";
import { CytoscapeService } from "../visuall/cytoscape.service";
import { DbAdapterService } from "../visuall/db-service/db-adapter.service";
import { GlobalVariableService } from "../visuall/global-variable.service";
import { ContextMenuItem } from "../visuall/context-menu/icontext-menu";
import { DbQueryMeta, HistoryMetaData } from "../visuall/db-service/data-types";
import { HttpClient } from '@angular/common/http';
import { forEach } from "cypress/types/lodash";

@Injectable({
  providedIn: "root",
})

export class ContextMenuCustomizationService {
  private _menu: ContextMenuItem[];
  //Commit
  private _commit_developer = "COMMITS";
  private _commit_pr = "REFERENCES";
  private _commit_file = "CONTAINS";
  private _commit_issue = "REFERENCES";
  private _commit_review_developer = ["INCLUDES", "REVIEWS"]
  //File
  private _file_file = "RENAMED_TO";
  private _file_commit = "CONTAINS";
  private _file_developer = ["CONTAINS", "COMMITS"];
  private _file_pull_request = ["CONTAINS", "INCLUDES"];
  private _file_issue = ["CONTAINS", "REFERENCES"]
  //PullRequest
  private _pr_issue = "REFERENCES";
  private _pr_developer = ["OPENS", "MERGE", "REVIEWS"];
  private _pr_commit = "INCLUDES";
  private _pr_file = ["INCLUDES", "CONTAINS"]
  //Issue
  private _get_commit_for_issue_relation = "REFERENCES";
  private _get_developer_for_issue_relation = ["REFERENCES", "COMMITS"]
  private _get_files_for_issue_relation = ["REFERENCES", "CONTAINS"]
  private _get_developer_for_issue_relation2 = ["REPORTS", "ASSIGNED", "ASSIGNEE", "RESOLVE"];
  private _issue_issue = ["FIXES", "DEPENDS_UPON", "DUPLICATES", "BLOCKS", "INCORPORATES", "INCORPORATES", "RELATES_TO", "SUPERSEDES"]
  //Developer
  private _developer_pull_request = ["OPENS", "MERGE", "REVIEWS"];
  private _developer_issue = "REPORTS";
  private _developer_commit_pull_request = ["COMMITS", "INCLUDES"];
  private _developer_commits = "COMMITS";
  private _developer_commits_file = ["COMMITS", "CONTAINS"];
  private _developers_reviewBy_developer = ["REVIEWS", "INCLUDES", "COMMITS"];


  get menu(): ContextMenuItem[] {
    return this._menu;
  }
  constructor(
    private _cyService: CytoscapeService,
    private _dbService: DbAdapterService,
    private _g: GlobalVariableService,
    private _http: HttpClient
  ) {
    this._menu = [
      //Developer
      {
        id: "All Work",
        content: "All Work",
        selector: "node.Developer",
        submenu:
          //Developer pull request submenu
          [
            {
              id: "showAllWork",
              content: "Show All Work",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Work: " },
                  {}
                );
              },
            },
            {
              id: "hideAllWork",
              content: "Hide All Work",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide Work: " },
                  {}
                );
              },
            },
          ]
      },

      {
        id: "showDeveloperIssue",
        content: "Issue",
        selector: "node.Developer",
        submenu: [
          {
            id: "showDeveloperIssueReport",
            content: "Show Issues Reported",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue: " },
                { edgeType: this._developer_issue, targetType: "Issue" }
              );
            },
          },
          {
            id: "hideDeveloperIssue",
            content: "Hide Issues Reported",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue: " },
                { edgeType: this._developer_issue, targetType: "Issue" }
              );
            },
          },
          {
            id: "showDeveloperIssueAssign",
            content: "Show Issues Assigned By",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue: " },
                { edgeType: "ASSIGNEE", targetType: "Issue" }
              );
            },
          },
          {
            id: "hideDeveloperIssueAssign",
            content: "Hide Issues Assigned By",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue: " },
                { edgeType: "ASSIGNEE", targetType: "Issue" }
              );
            },
          },
          {
            id: "showDeveloperIssueAssigned",
            content: "Show Issues Assigned To",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue: " },
                { edgeType: "ASSIGNED", targetType: "Issue" }
              );
            },
          },
          {
            id: "hideDeveloperIssueAssigned",
            content: "Hide Issues Assigned To",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue: " },
                { edgeType: "ASSIGNED", targetType: "Issue" }
              );
            },
          },
          {
            id: "showDeveloperIssueResolve",
            content: "Show Issues Resolved",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue: " },
                { edgeType: "RESOLVE", targetType: "Issue" }
              );
            },
          },
          {
            id: "hideDeveloperIssueResolve",
            content: "Hide Issues Resolved",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue: " },
                { edgeType: "RESOLVE", targetType: "Issue" }
              );
            },
          },
          {
            id: "showDeveloperIssueResolve",
            content: "Show Issues Closed",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue: " },
                { edgeType: "CLOSE", targetType: "Issue" }
              );
            },
          },
          {
            id: "hideDeveloperIssueResolve",
            content: "Hide Issues Closed",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue: " },
                { edgeType: "CLOSE", targetType: "Issue" }
              );
            },
          },
        ]
      },
      {
        id: "showDeveloper Pull Requests",
        content: "Pull Requests",
        selector: "node.Developer",
        submenu:
          //Developer pull request submenu
          [
            {
              id: "showDeveloperPullRequestsOpen",
              content: "Show Pull Requests Opened",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Pull Requests: " },
                  { edgeType: "OPENS", targetType: "PullRequest" }
                );
              },
            },
            {
              id: "hideDeveloperPullRequestsOpen",
              content: "Hide Pull Requests Opened",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Pull Requests: " },
                  { edgeType: "OPENS", targetType: "PullRequest" }
                );
              },
            },
            {
              id: "showDeveloperPullRequestsMerge",
              content: "Show  Pull Requests Merged ",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Pull Requests: " },
                  { edgeType: "MERGE", targetType: "PullRequest" }
                );
              },
            },
            {
              id: "hideDeveloperPullRequestsMerge",
              content: "Hide Pull Requests Merged",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Pull Requests: " },
                  { edgeType: " MERGE", targetType: "PullRequest" }
                );
              },
            },
            {
              id: "showDeveloperPullRequestsReview",
              content: "Show Pull Requests Reviewed",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Pull Requests: " },
                  { edgeType: "REVIEWS", targetType: "PullRequest" }
                );
              },
            },
            {
              id: "hideDeveloperPullRequestsReview",
              content: "Hide Pull Requests Reviewed",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Pull Requests: " },
                  { edgeType: "REVIEWS", targetType: "PullRequest" }
                );
              },
            },
            {
              id: "showDeveloperCommitPullRequests",
              content: "Show Pull Requests Committed",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Committed Pull Requests: " },
                  {
                    isMultiLength: true,
                    edgeType: this._developer_commit_pull_request,
                    targetType: "PullRequest"
                  }
                );
              },
            },
            {
              id: "hideDeveloperCommitPullRequests",
              content: "Hide Pull Requests Committed",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Committed Pull Requests: " },
                  {
                    isMultiLength: true,
                    edgeType: this._developer_commit_pull_request,
                    targetType: "PullRequest"
                  }
                );
              },
            },
          ]
      },
      {
        id: "commit",
        content: "Commit",
        selector: "node.Developer",
        submenu: [

          {
            id: "showDeveloperCommits",
            content: "Show Commits",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show Commits: " },
                {
                  isMultiLength: false,
                  edgeType: this._developer_commits,
                  targetType: "Commit"
                }
              );
            },
          },
          {
            id: "hideDeveloperCommits",
            content: "Hide Commits",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Show Commits: " },
                {
                  isMultiLength: false,
                  edgeType: this._developer_commits,
                  targetType: "Commit"
                }
              );
            },
          },
        ]
      },
      {
        id: "file developer",
        content: "File",
        selector: "node.Developer",
        submenu: [
          {
            id: "showDeveloperCommitsFile",
            content: "Show Files Committed Into",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show Commits: " },
                {
                  isMultiLength: true,
                  edgeType: this._developer_commits_file,
                  targetType: "File"
                }
              );
            },
          },
          {
            id: "hideDeveloperCommitsFile",
            content: "Hide Files Committed Into",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Show Commits: " },
                {
                  isMultiLength: true,
                  edgeType: this._developer_commits_file,
                  targetType: "File"
                }
              );
            },
          },
        ]
      },
      {
        id: "Developer",
        content: "Developer",
        selector: "node.Developer",
        submenu: [
          {
            id: "showDeveloperReview",
            content: "Show Developers Reviewed",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show Developers: " },
                {
                  isMultiLength: true,
                  edgeType: this._developers_reviewBy_developer,
                  targetType: "Developer"
                }
              );
            },
          },
          {
            id: "hideDeveloperReview",
            content: "Hide Developers Reviewed",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Show Developers: " },
                {
                  isMultiLength: true,
                  edgeType: this._developers_reviewBy_developer,
                  targetType: "Developer"
                }
              );
            },
          },
        ]
      },

      //Commit
      {
        id: "commit all",
        content: "All Related",
        selector: "node.Commit",
        submenu: [
          {
            id: "showCommitRelated",
            content: "Show All Related",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show Files: " },
                {}
              );
            },
          },
          {
            id: "hideAllRelatedCommit",
            content: "Hide All Related",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Hide Related: " },
                {}
              );
            },
          },
        ]
      },
      {
        id: "related_commit_pr",
        content: "Pull Request",
        selector: "node.Commit",
        submenu: [

          {
            id: "showCommitPR",
            content: "Show Pull Request",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show Pull Request: " },
                {
                  edgeType: this._commit_pr,
                  targetType: "PullRequest"
                }
              );
            },
          },
          {
            id: "hideCommitPR",
            content: "Hide Pull Request",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Show Pull Request: " },
                {
                  edgeType: this._commit_pr,
                  targetType: "PullRequest"
                }
              );
            },
          },
        ]
      },
      {
        id: "related_commit_file",
        content: "File",
        selector: "node.Commit",
        submenu: [
          {
            id: "showCommitFile",
            content: "Show Modified Files ",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show File: " },
                {
                  edgeType: this._commit_file,
                  targetType: "File"
                }
              );
            },
          },
          {
            id: "hideCommitFile",
            content: "Hide Modified Files",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Show File: " },
                {
                  edgeType: this._commit_file,
                  targetType: "File"
                }
              );
            },
          },
        ]
      },
      {
        id: "related_commit_issue",
        content: "Issue",
        selector: "node.Commit",
        submenu: [
          {
            id: "showCommitIssue",
            content: "Show Issue Referenced To",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue: " },
                {
                  edgeType: this._commit_issue,
                  targetType: "Issue"
                }
              );
            },
          },
          {
            id: "hideCommitIssue",
            content: "Hide Issue Referenced To",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue: " },
                {
                  edgeType: this._commit_issue,
                  targetType: "Issue"
                }
              );
            },
          },
        ]
      },
      {
        id: "showCommit Developer",
        content: "Developer",
        selector: "node.Commit",
        submenu:
          // Commit Developer submenu
          [
            {
              id: "showCommitDeveloper",
              content: "Show Author",
              selector: "node.Commit",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Developer: " },
                  {
                    edgeType: this._commit_developer,
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "hideCommitDeveloper",
              content: "Hide Author",
              selector: "node.Commit",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Developer: " },
                  {
                    edgeType: this._commit_developer,
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "showCommitReviewDeveloper",
              content: "Show Reviewer",
              selector: "node.Commit",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Developer: " },
                  { edgeType: this._commit_review_developer, isMultiLength: true }
                );
              },
            },
            {
              id: "hideCommitReviewDeveloper",
              content: "Hide Reviewer",
              selector: "node.Commit",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide Developer: " },
                  {
                    edgeType: this._commit_review_developer,
                    isMultiLength: true,
                    targetType: "Developer"
                  }
                );
              },
            }
          ]
      },
      //Issue
      {
        id: "related_issue",
        content: "All Related",
        selector: "node.Issue",
        submenu: [
          {
            id: "showIssueRelated",
            content: "Show All Related",
            selector: "node.Issue",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue Related Nodes: " },
                {}
              );
            },
          },
          {
            id: "hideAllRelatedIssue",
            content: "Hide All Related",
            selector: "node.Issue",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Hide Related: " },
                {}
              );
            },
          },
        ]
      },
      {
        id: "related_issue_pr",
        content: "Pull Request",
        selector: "node.Issue",
        submenu: [
          {
            id: "ShowRelatedPRofIssue",
            content: "Show Pull Requests Referenced",
            selector: "node.Issue",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show issue related pull request nodes: " },
                {
                  edgeType: "REFERENCES",
                  targetType: "PullRequest"
                }
              );
            },
          },
          {
            id: "HideRelatedPRofIssue",
            content: "Hide Pull Requests Referenced",
            selector: "node.Issue",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Show issue related pull request nodes: " },
                {
                  edgeType: "REFERENCES",
                  targetType: "PullRequest"
                }
              );
            },
          },
        ]
      },
      {
        id: "related_issue_file",
        content: "File",
        selector: "node.Issue",
        submenu: [
          {
            id: "ShowRelatedFiles",
            content: "Show Related Files",
            selector: "node.Issue",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Related Files: " },
                {
                  edgeType: this._get_files_for_issue_relation,
                  isMultiLength: true,
                  targetType: "File"
                }
              );
            },
          },
          {
            id: "HideRelatedFiles",
            content: "Hide  Related Files",
            selector: "node.Issue",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Related Files: " },
                {
                  edgeType: this._get_files_for_issue_relation,
                  isMultiLength: true,
                  targetType: "File"
                }
              );
            },
          },

        ]
      },
      {
        id: "related_issue_commit",
        content: "Commit",
        selector: "node.Issue",
        submenu: [
          {
            id: "ShowRelatedCommitsofIssue",
            content: "Show Commits Referenced",
            selector: "node.Issue",
            onClickFunction: (x) => {
              const node = x.target || x.cyTarget;
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue Related Commits Nodes1: " },
                {
                  edgeType: this._get_commit_for_issue_relation,
                  isMultiLength: false,
                  targetType: "Commit"
                }
              );
            },
          },
          {
            id: "HideRelatedCommitsofIssue",
            content: "Hide Commits Referenced",
            selector: "node.Issue",
            onClickFunction: (x) => {
              const node = x.target || x.cyTarget;
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Show Issue Related Commits Nodes1: " },
                {
                  edgeType: this._get_commit_for_issue_relation,
                  isMultiLength: false,
                  targetType: "Commit"
                }
              );
            },
          },

        ]
      },
      {
        id: "show Developers",
        content: "Developers",
        selector: "node.Issue",
        submenu:
          // Commit Developer submenu
          [
            {
              id: "ShowDevelopersCommit",
              content: "Show Committed Developers ",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Developers who worked on the solution: " },
                  {
                    edgeType: this._get_developer_for_issue_relation,
                    isMultiLength: true,
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "HideDevelopersCommit",
              content: "Hide Committed Developers ",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Developers who worked on the solution: " },
                  {
                    edgeType: this._get_developer_for_issue_relation,
                    isMultiLength: true,
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "ShowRelatedDevelopers1",
              content: "Show Reporter",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Developers related to issue: " },
                  {
                    edgeType: "REPORTS",
                    isMultiLength: false,
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "HideRelatedDevelopers1",
              content: "Hide Reporter",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Developers related to issue: " },
                  {
                    edgeType: "REPORTS",
                    isMultiLength: false,
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "ShowRelatedDevelopers2",
              content: "Show Assignee",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Developers related to issue: " },
                  {
                    edgeType: "ASSIGNED",
                    isMultiLength: false,
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "HideRelatedDevelopers2",
              content: "Hide Assignee",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Developers related to issue: " },
                  {
                    edgeType: "ASSIGNED",
                    isMultiLength: false,
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "ShowRelatedDevelopers3",
              content: "Show Assigner",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Developers related to issue: " },
                  {
                    edgeType: "ASSIGNEE",
                    isMultiLength: false,
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "HideRelatedDevelopers3",
              content: "Hide Assigner",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Developers related to issue: " },
                  {
                    edgeType: "ASSIGNEE",
                    isMultiLength: false,
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "ShowRelatedDevelopers",
              content: "Show  Resolver",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Developers related to issue: " },
                  {
                    edgeType: "RESOLVE",
                    isMultiLength: false,
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "HideRelatedDevelopers",
              content: "Hide Resolver",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Developers related to issue: " },
                  {
                    edgeType: "RESOLVE",
                    isMultiLength: false,
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "ShowRelatedDevelopers",
              content: "Show  Closer",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Developers related to issue: " },
                  {
                    edgeType: "CLOSE",
                    isMultiLength: false,
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "HideRelatedDevelopers",
              content: "Hide Closer",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Developers related to issue: " },
                  {
                    edgeType: "CLOSE",
                    isMultiLength: false,
                    targetType: "Developer"
                  }
                );
              },
            },
          ]
      },
      {
        id: "issue_issue",
        content: "Issue",
        selector: "node.Issue",
        submenu:
          // Commit Developer submenu
          [
            {
              id: "ShowIssueRelatedIssue",
              content: "Show  Related Issues",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Issues: " },
                  {
                    edgeType: this._issue_issue,
                    targetType: "Issue"
                  }
                );
              },
            },
            {
              id: "HideIssueRelatedIssue",
              content: "Hide  Related Issues",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Issues: " },
                  {
                    edgeType: this._issue_issue,
                    targetType: "Issue"
                  }
                );
              },
            },
          ]
      },
      //Pull Request
      {
        id: "pr",
        content: "All Related",
        selector: "node.PullRequest",
        submenu:
          // Commit Developer submenu
          [
            {
              id: "showPullRequestRelated",
              content: "Show All Related ",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Pull Request Related Nodes: " },
                  {}
                );
              },
            },
            {
              id: "hideAllRelatedPullRequest",
              content: "Hide All Related",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide Related: " },
                  {}
                );
              },
            },
          ]
      },
      {
        id: "pr_issue",
        content: "Issue",
        selector: "node.PullRequest",
        submenu:
          // Commit Developer submenu
          [
            {
              id: "showPullRequestIssue",
              content: "Show Issue Referenced To",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Issue: " },
                  {
                    edgeType: this._pr_issue,
                    targetType: "Issue"
                  }
                );
              },
            },
            {
              id: "hidePullRequestIssue",
              content: "Hide Issue Referenced To",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Issue: " },
                  {
                    edgeType: this._pr_issue,
                    targetType: "Issue"
                  }
                );
              },
            },
          ]
      },
      {
        id: "pr_developer",
        content: "Developer",
        selector: "node.PullRequest",
        submenu:
          // Commit Developer submenu
          [
            {
              id: "showPullRequestDeveloperOpen",
              content: "Show Opener",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Developers: " },
                  {
                    edgeType: "OPENS",
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "hidePullRequestDeveloper",
              content: "Hide Opener",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Developers: " },
                  {
                    edgeType: "OPENS",
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "showPullRequestDeveloperMerge",
              content: "Show Merger",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Developers: " },
                  {
                    edgeType: "MERGE",
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "hidePullRequestDeveloperMerge",
              content: "Hide Merger",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Developers: " },
                  {
                    edgeType: "MERGE",
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "showPullRequestDeveloperReview",
              content: "Show Reviewer ",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Developers: " },
                  {
                    edgeType: "REVIEWS",
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "hidePullRequestDeveloper",
              content: "Hide Reviewer",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Developers: " },
                  {
                    edgeType: "REVIEWS",
                    targetType: "Developer"
                  }
                );
              },
            },
          ]
      },
      {
        id: "pr_commit",
        content: "Commit",
        selector: "node.PullRequest",
        submenu:
          // Commit Developer submenu
          [
            {
              id: "showPullRequestCommit",
              content: "Show Commits",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Commits: " },
                  {
                    edgeType: this._pr_commit,
                    targetType: "Commit"
                  }
                );
              },
            },
            {
              id: "hidePullRequestCommit",
              content: "Hide Commits",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Commits: " },
                  {
                    edgeType: this._pr_commit,
                    targetType: "Commit"
                  }
                );
              },
            },
          ]
      },
      {
        id: "pr_files",
        content: "File",
        selector: "node.PullRequest",
        submenu:
          [
            {
              id: "showPullRequestFile",
              content: "Show Files Modified",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Files: " },
                  {
                    edgeType: this._pr_file, isMultiLength: true,
                    targetType: "File"
                  }
                );
              },
            },
            {
              id: "hidePullRequestFile",
              content: "Hide Files Modified",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Files: " },
                  {
                    edgeType: this._pr_file, isMultiLength: true,
                    targetType: "File"
                  }
                );
              },
            },
          ]
      },
      //File 
      {
        id: "file",
        content: "All Related",
        selector: "node.File",
        submenu:
          [
            {
              id: "showFileRelated",
              content: "Show All  Related",
              selector: "node.File",

              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show File Renamed To: " },
                  {}
                );
              },
            },
            {
              id: "hideAllRelatedFile",
              content: "Hide All Related",
              selector: "node.File",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide Related: " },
                  {}
                );
              },
            },
          ]
      },
      {
        id: "file_file",
        content: "File",
        selector: "node.File",
        submenu:
          // Commit Developer submenu
          [
            {
              id: "showFileRenameFile",
              content: "Show Renamed Files",
              selector: "node.File",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show File: " },
                  {
                    edgeType: this._file_file,
                    targetType: "File"
                  }
                );
              },
            },
            {
              id: "hideFileRenameFile",
              content: "Hide Renamed Files",
              selector: "node.File",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Show File: " },
                  {
                    edgeType: this._file_file,
                    targetType: "File"
                  }
                );
              },
            },
          ]
      },
      {
        id: "file_commit",
        content: "Commit",
        selector: "node.File",
        submenu:
          [
            {
              id: "showFileCommit",
              content: "Show Commits",
              selector: "node.File",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show Commits: " },
                  { edgeType: this._file_commit }
                );
              },
            },
            {
              id: "hideFileCommit",
              content: "Hide Commits",
              selector: "node.File",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide Commits: " },
                  {
                    edgeType: this._file_commit,
                    targetType: "Commit"
                  }
                );
              },
            },
          ]
      },
      {
        id: "file_developer",
        content: "Developer",
        selector: "node.File",
        submenu: [
      {
        id: "showFileDeveloper",
        content: "Show Developers",
        selector: "node.File",
        onClickFunction: (x) => {
          this.getNeighbors(
            x,
            { isNode: true, customTxt: "Show Developers: " },
            {
              edgeType: this._file_developer, isMultiLength: true,
              targetType: "Developer"
            }
          );
        },
      },
      {
        id: "hideFileDeveloper",
        content: "Hide Developers ",
        selector: "node.File",
        onClickFunction: (x) => {
          this.deleteNeighbors(
            x,
            { isNode: true, customTxt: "Show Developers: " },
            {
              edgeType: this._file_developer, isMultiLength: true,
              targetType: "Developer"
            }
          );
        },
      },
    ]},
    {
      id: "file_pr",
      content: "Pull Request ",
      selector: "node.File",
      submenu: [

      {
        id: "showFilePullRequests",
        content: "Show Related PullRequests",
        selector: "node.File",
        onClickFunction: (x) => {
          this.getNeighbors(
            x,
            { isNode: true, customTxt: "Show Pull Requests: " },
            { edgeType: this._file_pull_request, isMultiLength: true, targetType: "PullRequest" }
          );
        },
      },
      {
        id: "hideFilePullRequests",
        content: "Hide Related PullRequests",
        selector: "node.File",
        onClickFunction: (x) => {
          this.deleteNeighbors(
            x,
            { isNode: true, customTxt: "Hide Pull Requests: " },
            { edgeType: this._file_pull_request, isMultiLength: true, targetType: "PullRequest" }
          );
        },
      },
    ]},
    {
      id: "file_issue",
      content: "Issue ",
      selector: "node.File",
      submenu: [
      {
        id: "showFileIssue",
        content: "Show Related Issues",
        selector: "node.File",
        onClickFunction: (x) => {
          this.getNeighbors(
            x,
            { isNode: true, customTxt: "Show Issues: " },
            { edgeType: this._file_issue, isMultiLength: true }
          );
        },
      },
      {
        id: "hideFileIssue",
        content: "Hide Related Issues",
        selector: "node.File",
        onClickFunction: (x) => {
          this.deleteNeighbors(
            x,
            { isNode: true, customTxt: "Show Issues: " },
            { edgeType: this._file_issue, isMultiLength: true, targetType: "Issue" }
          );
        },
      },
    ]}
    ];
  }

  getNeighbors(event, historyMeta: HistoryMetaData, queryMeta: DbQueryMeta) {
    const ele = event.target || event.cyTarget;
    const targetNodeId = ele._private.data.id;
    this._dbService.getNeighbors(
      [ele.id().substr(1)],
      (x) => {
        this._cyService.loadElementsFromDatabase(x, true);
        /** 
        this._cyService.removeHighlights()
        x.nodes.forEach(element => {
          if (`n${element.id}` == targetNodeId || (!queryMeta.targetType || queryMeta.targetType == element.labels[0]) ) {
            this._g.cy.$('#' + `n${element.id}`).select();
          }
        },
        )   
        this._cyService.highlightSelected()    
        */
        /** 
        let targetNodes = []
        this._cyService.removeHighlights()
        x.nodes.forEach(element => {
          if(!queryMeta.targetType || queryMeta.targetType == element.labels[0]){
            targetNodes.push(this._g.cy.$('#' + `n${element.id}`))
          }
        });
         console.log(targetNodes)
        this._g.highlightElems(targetNodes);
        */
      },
      historyMeta,
      queryMeta
    );
  }
  deleteNeighbors(event, historyMeta: HistoryMetaData, queryMeta: DbQueryMeta) {
    const ele = event.target || event.cyTarget;
    const targetNodeId = ele._private.data.id;
    let arr = this._g.cy.nodes().map(x => x.id())
    console.log(arr)
    this._dbService.getNeighbors(
      [ele.id().substr(1)],
      (x) => {
        x.nodes.forEach(element => {
          if ((`n${element.id}` != targetNodeId) && (!queryMeta.targetType || queryMeta.targetType === element.labels[0])) {
            this._g.cy.$('#' + `n${element.id}`).select();
          }
        },
        )
        this._cyService.showHideSelectedElements(true)
      },
      historyMeta,
      queryMeta
    );
  }


}
