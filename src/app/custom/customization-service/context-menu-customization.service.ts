import { Injectable } from "@angular/core";
import { CytoscapeService } from "../../visuall/cytoscape.service";
import { DbAdapterService } from "../../visuall/db-service/db-adapter.service";
import { GlobalVariableService } from "../../visuall/global-variable.service";
import { ContextMenuItem } from "../../visuall/context-menu/icontext-menu";
import { DbQueryMeta, HistoryMetaData } from "../../visuall/db-service/data-types";
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: "root",
})

export class ContextMenuCustomizationService {
  private _menu: ContextMenuItem[];
  //Commit
  private _commit_developer = "COMMITTED";
  private _commit_pr = "INCLUDES";
  private _commit_file = "CONTAINS";
  private _commit_issue = "REFERENCED_COMMIT";
  private _commit_review_developer = ["INCLUDES", "REVIEWED"]
  //File
  private _file_file = "RENAMED_TO";
  private _file_commit = "CONTAINS";
  private _file_developer = ["CONTAINS", "COMMITTED"];
  private _file_pull_request = ["CONTAINS", "INCLUDES"];
  private _file_issue = ["CONTAINS", "REFERENCED_COMMIT"]
  //private _file_issue = [["CONTAINS","INCLUDES", "REFERENCED_PR"],["CONTAINS", "REFERENCED_COMMIT"]] (Visuall not let to run multilength multipath queries)
  //PullRequest
  private _pr_issue = "REFERENCED_PR";
  private _pr_commit = "INCLUDES";
  private _pr_file = ["INCLUDES", "CONTAINS"]
  private _pr_developer = ["INCLUDES", "COMMITTED"]
  //Issue
  private _get_pr_for_issue_relation =  "REFERENCED_PR";
  private _get_commit_for_issue_relation = "REFERENCED_COMMIT";
  private _get_developer_for_issue_relation_pr = ["REFERENCED_PR", "INCLUDES", "COMMITTED"]
  private _get_files_for_issue_relation_pr = ["REFERENCED_PR", "INCLUDES","CONTAINS"]
  private _get_developer_for_issue_relation_commit= ["REFERENCED_COMMIT", "COMMITTED"]
  private _get_files_for_issue_relation_commit = ["REFERENCED_COMMIT", "CONTAINS"]
  private _issue_issue = ["FIXES", "DEPENDS_UPON", "DUPLICATES", "BLOCKS", "INCORPORATES", "INCORPORATES", "RELATES_TO", "SUPERSEDES"]
  //Developer
  private _developer_commit_pull_request = ["COMMITTED", "INCLUDES"];
  private _developer_commits = "COMMITTED";
  private _developer_commits_file = ["COMMITTED", "CONTAINS"];
  private _developers_reviewBy_developer = ["REVIEWED", "INCLUDES", "COMMITTED"];


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
              id: "showAllWorkRecent",
              content: "Show Recent Work",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show developer recent work: " },
                  {},
                  this._g.userPrefs.queryNeighborLimit.getValue()
                );
              },
            },
            {
              id: "showAllWork",
              content: "Show All Work",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show developer work: " },
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
                  { isNode: true, customTxt: "Hide developer work: " },
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
            id: "showDeveloperIssueReportRecent",
            content: "Show Issues Recently Reported ",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show refcently reported issues: " },
                { edgeType: "REPORTED", targetType: "Issue" },
                this._g.userPrefs.queryNeighborLimit.getValue()
              );
            },
          },
          {
            id: "showDeveloperIssueReport",
            content: "Show Issues Reported",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show reported issues: " },
                { edgeType: "REPORTED", targetType: "Issue" }
              );
            },
          },
          {
            id: "hideDeveloperIssue",
            content: "Hide Issues Reported",
            selector: "node.Developer",
            hasTrailingDivider: true,
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Hide reported issues: " },
                { edgeType: "REPORTED", targetType: "Issue" }
              );
            },
          },
          {
            id: "showDeveloperIssueAssignRecent",
            content: "Show Issues Recently Assigned By",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show issues recently assigned by: " },
                { edgeType: "ASSIGNED_BY", targetType: "Issue" },
                this._g.userPrefs.queryNeighborLimit.getValue()
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
                { isNode: true, customTxt: "Show issues assigned by: " },
                { edgeType: "ASSIGNED_BY", targetType: "Issue" }
              );
            },
          },      
          {
            id: "hideDeveloperIssueAssign",
            content: "Hide Issues Assigned By",
            selector: "node.Developer",
            hasTrailingDivider: true,
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Hide issues assigned by: " },
                { edgeType: "ASSIGNED_BY", targetType: "Issue" }
              );
            },
          },
          {
            id: "showDeveloperIssueAssignedRecent",
            content: "Show Issues Recently  Assigned To",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show issues recently assigned to: " },
                { edgeType: "ASSIGNED_TO", targetType: "Issue" },
                this._g.userPrefs.queryNeighborLimit.getValue()
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
                { isNode: true, customTxt: "Show issues assigned to: " },
                { edgeType: "ASSIGNED_TO", targetType: "Issue" }
              );
            },
          },

          {
            id: "hideDeveloperIssueAssigned",
            content: "Hide Issues Assigned To",
            selector: "node.Developer",
            hasTrailingDivider: true,
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Hide issues assigned to: " },
                { edgeType: "ASSIGNED_TO", targetType: "Issue" }
              );
            },
          },
          {
            id: "showDeveloperIssueRecentlyResolve",
            content: "Show Issues Recently Resolved",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show issues recently resolved: " },
                { edgeType: "RESOLVED", targetType: "Issue" },
                this._g.userPrefs.queryNeighborLimit.getValue()
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
                { isNode: true, customTxt: "Show issues resolved: " },
                { edgeType: "RESOLVED", targetType: "Issue" }
              );
            },
          },          
          {
            id: "hideDeveloperIssueResolve",
            content: "Hide Issues Resolved",
            selector: "node.Developer",
            hasTrailingDivider: true,
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Hide issues resolved: " },
                { edgeType: "RESOLVED", targetType: "Issue" }
              );
            },
          },
          {
            id: "showDeveloperIssueCloseRecent",
            content: "Show Issues Recently Closed",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show issues recently closed: " },
                { edgeType: "CLOSED", targetType: "Issue" },
                this._g.userPrefs.queryNeighborLimit.getValue()
              );
            },
          },
          {
            id: "showDeveloperIssueClose",
            content: "Show Issues Closed",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show issues closed: " },
                { edgeType: "CLOSED", targetType: "Issue" }
              );
            },
          },
          {
            id: "hideDeveloperIssueClose",
            content: "Hide Issues Closed",
            selector: "node.Developer",
            hasTrailingDivider: true,
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Hide issues closed: " },
                { edgeType: "CLOSED", targetType: "Issue" }
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
              id: "showDeveloperPullRequestsOpenRecent",
              content: "Show Pull Requests Recently Opened",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show pull requests recently opened: " },
                  { edgeType: "OPENED", targetType: "PullRequest" },
                  this._g.userPrefs.queryNeighborLimit.getValue()
                );
              },
            },
            {
              id: "showDeveloperPullRequestsOpen",
              content: "Show Pull Requests Opened",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show pull requests opened: " },
                  { edgeType: "OPENED", targetType: "PullRequest" }
                );
              },
            },
            {
              id: "hideDeveloperPullRequestsOpen",
              content: "Hide Pull Requests Opened",
              selector: "node.Developer",
              hasTrailingDivider: true,
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide pull requests opened: " },
                  { edgeType: "OPENED", targetType: "PullRequest" }
                );
              },
            },
            {
              id: "showDeveloperPullRequestsMergeRecent",
              content: "Show  Pull Requests Recently Merged ",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show pull requests recently merged: " },
                  { edgeType: "MERGED", targetType: "PullRequest" },
                  this._g.userPrefs.queryNeighborLimit.getValue()
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
                  { isNode: true, customTxt: "Show pull requests merged: " },
                  { edgeType: "MERGED", targetType: "PullRequest" }
                );
              },
            },
            {
              id: "hideDeveloperPullRequestsMerge",
              content: "Hide Pull Requests Merged",
              selector: "node.Developer",
              hasTrailingDivider: true,
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide pull requests merged: " },
                  { edgeType: " MERGED", targetType: "PullRequest" }
                );
              },
            },
            {
              id: "showDeveloperPullRequestsReviewRecent",
              content: "Show Pull Requests Recently Reviewed ",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show pull requests recently reviewed: " },
                  { edgeType: "REVIEWED", targetType: "PullRequest" },
                  this._g.userPrefs.queryNeighborLimit.getValue()
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
                  { isNode: true, customTxt: "Show pull requests reviewed: " },
                  { edgeType: "REVIEWED", targetType: "PullRequest" }
                );
              },
            },
            {
              id: "hideDeveloperPullRequestsReview",
              content: "Hide Pull Requests Reviewed",
              selector: "node.Developer",
              hasTrailingDivider: true,
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide pull requests reviewed: " },
                  { edgeType: "REVIEWED", targetType: "PullRequest" }
                );
              },
            },
            {
              id: "showDeveloperCommitPullRequestsRecent",
              content: "Show Pull Requests Recently Committed",
              selector: "node.Developer",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show pull requests recently committed: " },
                  {
                    isMultiLength: true,
                    edgeType: this._developer_commit_pull_request,
                    targetType: "PullRequest"
                  },
                  this._g.userPrefs.queryNeighborLimit.getValue()
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
                  { isNode: true, customTxt: "Show pull requests committed: " },
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
              hasTrailingDivider: true,
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide pull requests committed: " },
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
            id: "showDeveloperCommitsRecent",
            content: "Show Recent Commits",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show recent commits: " },
                {
                  isMultiLength: false,
                  edgeType: this._developer_commits,
                  targetType: "Commit"
                },
                this._g.userPrefs.queryNeighborLimit.getValue()
              );
            },
          },
          {
            id: "showDeveloperCommits",
            content: "Show Commits",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show commits: " },
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
                { isNode: true, customTxt: "Hide commits: " },
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
            id: "showDeveloperCommitsFileRecent",
            content: "Show Files Recently Committed To",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show files recently committed into: " },
                {
                  isMultiLength: true,
                  edgeType: this._developer_commits_file,
                  targetType: "File"
                },
                this._g.userPrefs.queryNeighborLimit.getValue()
              );
            },
          },
          {
            id: "showDeveloperCommitsFile",
            content: "Show Files Committed To",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show files committed into: " },
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
            content: "Hide Files Committed To",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Hide  files committed into: " },
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
        hasTrailingDivider: true,
        submenu: [
          {
            id: "showDeveloperReview",
            content: "Show Developers Reviewed",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show developers reviewed: " },
                {
                  isMultiLength: true,
                  edgeType: this._developers_reviewBy_developer,
                  targetType: "Developer"
                }
              );
            },
          },
          {
            id: "showDeveloperReviewRecently",
            content: "Show Developers Recently Reviewed",
            selector: "node.Developer",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show developers recently reviewed: " },
                {
                  isMultiLength: true,
                  edgeType: this._developers_reviewBy_developer,
                  targetType: "Developer"
                },
                this._g.userPrefs.queryNeighborLimit.getValue()
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
                { isNode: true, customTxt: "Hide developers reviewed: " },
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
            id: "showCommitRelatedRecent",
            content: "Show Recently Related",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show all related: " },
                {},
                this._g.userPrefs.queryNeighborLimit.getValue()
              );
            },
          },
          {
            id: "showCommitRelated",
            content: "Show All Related",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show all related: " },
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
                { isNode: true, customTxt: "Hide all related: " },
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
                { isNode: true, customTxt: "Show pull request: " },
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
                { isNode: true, customTxt: "Hide pull request: " },
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
            content: "Show Some Modified Files ",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show some modified files: " },
                {
                  edgeType: this._commit_file,
                  targetType: "File"
                },
                this._g.userPrefs.queryNeighborLimit.getValue()
              );
            },
          },
          {
            id: "showCommitFile",
            content: "Show Modified Files ",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show modified files: " },
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
                { isNode: true, customTxt: "Hide files modified: " },
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
            content: "Show Recently Referencing Issues",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show issues recently referenced: " },
                {
                  edgeType: this._commit_issue,
                  targetType: "Issue"
                },
                this._g.userPrefs.queryNeighborLimit.getValue()
              );
            },
          },
          {
            id: "showCommitIssue",
            content: "Show Referencing Issues",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show issues referenced: " },
                {
                  edgeType: this._commit_issue,
                  targetType: "Issue"
                }
              );
            },
          },
          {
            id: "hideCommitIssue",
            content: "Hide Referencing Issues",
            selector: "node.Commit",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Hide issues referenced: " },
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
        hasTrailingDivider: true,
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
                  { isNode: true, customTxt: "Show author: " },
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
              hasTrailingDivider: true,
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide author: " },
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
                  { isNode: true, customTxt: "Show reviewer: " },
                  { edgeType: this._commit_review_developer, isMultiLength: true }
                );
              },
            },
            {
              id: "hideCommitReviewDeveloper",
              content: "Hide Reviewer",
              selector: "node.Commit",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide reviewer: " },
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
            id: "showIssueRelatedRecent",
            content: "Show Recently Related",
            selector: "node.Issue",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show recently related: " },
                {},
                this._g.userPrefs.queryNeighborLimit.getValue()
              );
            },
          },
          {
            id: "showIssueRelated",
            content: "Show All Related",
            selector: "node.Issue",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show all related: " },
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
                { isNode: true, customTxt: "Hide all related: " },
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
            id: "ShowRelatedPRofIssueRecent",
            content: "Show Pull Requests Recently Referenced",
            selector: "node.Issue",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show pull request recently referenced: " },
                {
                  edgeType: "REFERENCED_PR",
                  targetType: "PullRequest"
                },
                this._g.userPrefs.queryNeighborLimit.getValue()
              );
            },
          },
          {
            id: "ShowRelatedPRofIssue",
            content: "Show Pull Requests Referenced",
            selector: "node.Issue",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show pull request referenced: " },
                {
                  edgeType: "REFERENCED_PR",
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
                { isNode: true, customTxt: "Hide pull request referenced: " },
                {
                  edgeType: "REFERENCED_PR",
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
            id: "ShowRelatedFilesRecent",
            content: "Show Files Recently Related",
            selector: "node.Issue",
            submenu:[
              {
                id: "ShowRelatedFilesRecentCommit",
                content: "Commit",
                selector: "node.Issue",
                onClickFunction: (x) => {
                  this.getNeighbors(
                    x,
                    { isNode: true, customTxt: "Show files recently related (commit): " },
                    {
                      edgeType: this._get_files_for_issue_relation_commit,
                      isMultiLength: true,
                      targetType: "File"
                    },
                    this._g.userPrefs.queryNeighborLimit.getValue()
                  );
                },
              },  
              {
                id: "ShowRelatedFilesRecentPr",
                content: "Pull Request",
                selector: "node.Issue",
                onClickFunction: (x) => {
                  this.getNeighbors(
                    x,
                    { isNode: true, customTxt: "Show files recently related (pr): " },
                    {
                      edgeType: this._get_files_for_issue_relation_pr,
                      isMultiLength: true,
                      targetType: "File"
                    },
                    this._g.userPrefs.queryNeighborLimit.getValue()
                  );
                },
              },        
              
            ]
          },
          {
            id: "ShowRelatedFiles",
            content: "Show Files Related",
            selector: "node.Issue",
            submenu:[
              {
                id: "ShowRelatedFilesCommit",
                content: "Commit",
                selector: "node.Issue",
                onClickFunction: (x) => {
                  this.getNeighbors(
                    x,
                    { isNode: true, customTxt: "Show related files (commit): " },
                    {
                      edgeType: this._get_files_for_issue_relation_commit,
                      isMultiLength: true,
                      targetType: "File"
                    }
                  );
                },
              },
              {
                id: "ShowRelatedFilesPr",
                content: "Pull Request",
                selector: "node.Issue",
                onClickFunction: (x) => {
                  this.getNeighbors(
                    x,
                    { isNode: true, customTxt: "Show related files (pr): " },
                    {
                      edgeType: this._get_files_for_issue_relation_pr,
                      isMultiLength: true,
                      targetType: "File"
                    }
                  );
                },
              }
            ]
          },
          {
            id: "HideRelatedFiles",
            content: "Hide  Related Files",
            selector: "node.Issue",
            hasTrailingDivider: true,
            submenu:[
              {
                id: "HideRelatedFilesCommit",
                content: "Commit",
                selector: "node.Issue",
                hasTrailingDivider: true,
                onClickFunction: (x) => {
                  this.deleteNeighbors(
                    x,
                    { isNode: true, customTxt: "Hide related files (commit): " },
                    {
                      edgeType: this._get_files_for_issue_relation_commit,
                      isMultiLength: true,
                      targetType: "File"
                    }
                  );
                },
              },
              {
                id: "HideRelatedFilesPr",
                content: "Pull Request",
                selector: "node.Issue",
                hasTrailingDivider: true,
                onClickFunction: (x) => {
                  this.deleteNeighbors(
                    x,
                    { isNode: true, customTxt: "Hide related files (pull request): " },
                    {
                      edgeType: this._get_files_for_issue_relation_pr,
                      isMultiLength: true,
                      targetType: "File"
                    }
                  );
                },
              },
            ]
          }
        ]
      },
      
      {
        id: "related_issue_commit",
        content: "Commit",
        selector: "node.Issue",
        submenu: [
          {
            id: "ShowRelatedCommitsofIssueRecent",
            content: "Show Commits Recently Referenced",
            selector: "node.Issue",
            onClickFunction: (x) => {
              const node = x.target || x.cyTarget;
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show commits recently referenced: " },
                {
                  edgeType: this._get_commit_for_issue_relation,
                  isMultiLength: false,
                  targetType: "Commit"
                },
                this._g.userPrefs.queryNeighborLimit.getValue()
              );
            },
          },
          {
            id: "ShowRelatedCommitsofIssue",
            content: "Show Commits Referenced",
            selector: "node.Issue",
            onClickFunction: (x) => {
              const node = x.target || x.cyTarget;
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show referenced commits: " },
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
                { isNode: true, customTxt: "Hide referenced commits: " },
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
              id: "ShowDevelopersCommitRecent",
              content: "Show Recently Committing Developers",
              selector: "node.Issue",
              submenu:
              [
                {
                  id: "ShowDevelopersCommitRecentCommit",
                  content: "Commit",
                  selector: "node.Issue",
                  onClickFunction: (x) => {
                    this.getNeighbors(
                      x,
                      { isNode: true, customTxt: "Show developers who worked on the solution (commit): " },
                      {
                        edgeType: this._get_developer_for_issue_relation_commit,
                        isMultiLength: true,
                        targetType: "Developer"
                      },
                      this._g.userPrefs.queryNeighborLimit.getValue()
                    );
                  },
                },
                {
                  id: "ShowDevelopersCommitRecentPr",
                  content: "Pull Request",
                  selector: "node.Issue",
                  onClickFunction: (x) => {
                    this.getNeighbors(
                      x,
                      { isNode: true, customTxt: "Show developers who worked on the solution (pr): " },
                      {
                        edgeType: this._get_developer_for_issue_relation_pr,
                        isMultiLength: true,
                        targetType: "Developer"
                      },
                      this._g.userPrefs.queryNeighborLimit.getValue()
                    );
                  },
                },
              ]
            },
            {
              id: "ShowDevelopersCommit",
              content: "Show Committing Developers",
              selector: "node.Issue",
              submenu:[
                {
                  id: "ShowDevelopersCommitCommit",
                  content: "Commit",
                  selector: "node.Issue",
                  onClickFunction: (x) => {
                    this.getNeighbors(
                      x,
                      { isNode: true, customTxt: "Show developers who worked on the solution: " },
                      {
                        edgeType: this._get_developer_for_issue_relation_commit,
                        isMultiLength: true,
                        targetType: "Developer"
                      }
                    );
                  },
                },
                {
                  id: "ShowDevelopersCommitPr",
                  content: "Pull Request",
                  selector: "node.Issue",
                  onClickFunction: (x) => {
                    this.getNeighbors(
                      x,
                      { isNode: true, customTxt: "Show developers who worked on the solution: " },
                      {
                        edgeType: this._get_developer_for_issue_relation_pr,
                        isMultiLength: true,
                        targetType: "Developer"
                      }
                    );
                  },
                }
              ]

 
            },
            {
              id: "HideDevelopersCommit",
              content: "Hide Committing Developers",
              selector: "node.Issue",
              hasTrailingDivider: true,
              submenu:[
                {
                  id: "HideDevelopersCommitCommit",
                  content: "Commit",
                  selector: "node.Issue",
                  hasTrailingDivider: true,
                  onClickFunction: (x) => {
                    this.deleteNeighbors(
                      x,
                      { isNode: true, customTxt: "Hide developers who worked on the solution: " },
                      {
                        edgeType: this._get_developer_for_issue_relation_commit,
                        isMultiLength: true,
                        targetType: "Developer"
                      }
                    );
                  },
                },
                {
                  id: "HideDevelopersCommitPr",
                  content: "Pull Request",
                  selector: "node.Issue",
                  hasTrailingDivider: true,
                  onClickFunction: (x) => {
                    this.deleteNeighbors(
                      x,
                      { isNode: true, customTxt: "Hide developers who worked on the solution: " },
                      {
                        edgeType: this._get_developer_for_issue_relation_pr,
                        isMultiLength: true,
                        targetType: "Developer"
                      }
                    );
                  },
                },
              ]
            },
            {
              id: "ShowRelatedDevelopers",
              content: "Show Reporter",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show reporter: " },
                  {
                    edgeType: "REPORTED",
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
              hasTrailingDivider: true,
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide reporter: " },
                  {
                    edgeType: "REPORTED",
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
                  { isNode: true, customTxt: "Show assignee: " },
                  {
                    edgeType: "ASSIGNED_TO",
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
              hasTrailingDivider: true,
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide assignee: " },
                  {
                    edgeType: "ASSIGNED_TO",
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
                  { isNode: true, customTxt: "Show assigner: " },
                  {
                    edgeType: "ASSIGNED_BY",
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
              hasTrailingDivider: true,
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide assigner: " },
                  {
                    edgeType: "ASSIGNED_BY",
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
                  { isNode: true, customTxt: "Show resolver: " },
                  {
                    edgeType: "RESOLVED",
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
              hasTrailingDivider: true,
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide resolver: " },
                  {
                    edgeType: "RESOLVED",
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
                  { isNode: true, customTxt: "Show closer: " },
                  {
                    edgeType: "CLOSED",
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
              hasTrailingDivider: true,
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide closer: " },
                  {
                    edgeType: "CLOSED",
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
        hasTrailingDivider: true,
        submenu:
          // Commit Developer submenu
          [
            {
              id: "ShowIssueRelatedIssueRecent",
              content: "Show  Recent Related Issues",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show recent related issues: " },
                  {
                    edgeType: this._issue_issue,
                    targetType: "Issue"
                  },
                  this._g.userPrefs.queryNeighborLimit.getValue()
                );
              },
            },
            {
              id: "ShowIssueRelatedIssue",
              content: "Show  Related Issues",
              selector: "node.Issue",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show related issues: " },
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
                  { isNode: true, customTxt: "Hide related issues: " },
                  {
                    edgeType: this._issue_issue,
                    targetType: "Issue"
                  }
                );
              },
            },
          ]
      },
      {
        id: "report_anomaly",
        content: "Report Anomalies",
        selector: "node.Issue",
        hasTrailingDivider: true,
        onClickFunction: (x) => {
          this.reportAnomaly(x);
        },

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
              content: "Show Recent Related ",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show recently related: " },
                  {},
                  this._g.userPrefs.queryNeighborLimit.getValue()
                );
              },
            },
            {
              id: "showPullRequestRelated",
              content: "Show All Related ",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show recently related: " },
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
                  { isNode: true, customTxt: "Hide related: " },
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
              id: "showPullRequestIssueRecent",
              content: "Show Recently Referencing Issues",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show recently referenced issues: " },
                  {
                    edgeType: this._pr_issue,
                    targetType: "Issue"
                  },
                  this._g.userPrefs.queryNeighborLimit.getValue()
                );
              },
            },
            {
              id: "showPullRequestIssue",
              content: "Show Referencing Issues",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show referenced issues: " },
                  {
                    edgeType: this._pr_issue,
                    targetType: "Issue"
                  }
                );
              },
            },
            {
              id: "hidePullRequestIssue",
              content: "Hide Referencing Issues",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide referenced issues: " },
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
                  { isNode: true, customTxt: "Show opener: " },
                  {
                    edgeType: "OPENED",
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "hidePullRequestDeveloper",
              content: "Hide Opener",
              selector: "node.PullRequest",
              hasTrailingDivider: true,
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide opener: " },
                  {
                    edgeType: "OPENED",
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
                  { isNode: true, customTxt: "Show merger: " },
                  {
                    edgeType: "MERGED",
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "hidePullRequestDeveloperMerge",
              content: "Hide Merger",
              selector: "node.PullRequest",
              hasTrailingDivider: true,
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide merger: " },
                  {
                    edgeType: "MERGED",
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
                  { isNode: true, customTxt: "Show reviewer: " },
                  {
                    edgeType: "REVIEWED",
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "hidePullRequestDeveloper",
              content: "Hide Reviewer",
              selector: "node.PullRequest",
              hasTrailingDivider: true,
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide reviewer: " },
                  {
                    edgeType: "REVIEWED",
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "showPullRequestDeveloperCommitters",
              content: "Show Committers",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show committers: " },
                  {
                    isMultiLength: true,
                    edgeType: this._pr_developer,
                    targetType: "Developer"
                  }
                );
              },
            },
            {
              id: "hidePullRequestCommitter",
              content: "Hide Committers",
              selector: "node.PullRequest",
              hasTrailingDivider: true,
              onClickFunction: (x) => {
                this.deleteNeighbors(
                  x,
                  { isNode: true, customTxt: "Hide committers: " },
                  {
                    isMultiLength: true,
                    edgeType: this._pr_developer,
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
              content: "Show Recent Commits",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show recent commits: " },
                  {
                    edgeType: this._pr_commit,
                    targetType: "Commit"
                  },
                  this._g.userPrefs.queryNeighborLimit.getValue()
                );
              },
            },
            {
              id: "showPullRequestCommit",
              content: "Show Commits",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show commits: " },
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
                  { isNode: true, customTxt: "Hide commits: " },
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
        hasTrailingDivider: true,
        submenu:
          [
            {
              id: "showPullRequestFileRecent",
              content: "Show Files Recently Modified",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show recently modified files: " },
                  {
                    edgeType: this._pr_file, isMultiLength: true,
                    targetType: "File"
                  },
                  this._g.userPrefs.queryNeighborLimit.getValue()
                );
              },
            },
            {
              id: "showPullRequestFile",
              content: "Show Files Modified",
              selector: "node.PullRequest",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show modified files: " },
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
                  { isNode: true, customTxt: "Hide modified files: " },
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
              id: "showFileRelatedRecent",
              content: "Show Recently Related",
              selector: "node.File",

              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show recently related: " },
                  {},
                  this._g.userPrefs.queryNeighborLimit.getValue()
                );
              },
            },
            {
              id: "showFileRelated",
              content: "Show All  Related",
              selector: "node.File",

              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show all related: " },
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
                  { isNode: true, customTxt: "Hide all related: " },
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
                  { isNode: true, customTxt: "Show renamed files: " },
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
                  { isNode: true, customTxt: "Hide renamed files: " },
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
              id: "showFileCommitRecent",
              content: "Show Recent Commits",
              selector: "node.File",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show recent commits: " },
                  { edgeType: this._file_commit },
                  this._g.userPrefs.queryNeighborLimit.getValue()
                );
              },
            },
            {
              id: "showFileCommit",
              content: "Show Commits",
              selector: "node.File",
              onClickFunction: (x) => {
                this.getNeighbors(
                  x,
                  { isNode: true, customTxt: "Show commits: " },
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
                  { isNode: true, customTxt: "Hide commits: " },
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
            id: "showFileDeveloperRecent",
            content: "Show Recently Committing Developers",
            selector: "node.File",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show developers recently committed into: " },
                {
                  edgeType: this._file_developer, isMultiLength: true,
                  targetType: "Developer"
                },
                this._g.userPrefs.queryNeighborLimit.getValue()
              );
            },
          },
          {
            id: "showFileDeveloper",
            content: "Show Committing Developers",
            selector: "node.File",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show developers committed into: " },
                {
                  edgeType: this._file_developer, isMultiLength: true,
                  targetType: "Developer"
                }
              );
            },
          },
          {
            id: "hideFileDeveloper",
            content: "Hide Committing Developers ",
            selector: "node.File",
            onClickFunction: (x) => {
              this.deleteNeighbors(
                x,
                { isNode: true, customTxt: "Hide developers committed into: " },
                {
                  edgeType: this._file_developer, isMultiLength: true,
                  targetType: "Developer"
                }
              );
            },
          },
        ]
      },
      {
        id: "file_pr",
        content: "Pull Request ",
        selector: "node.File",
        submenu: [
          {
            id: "showFilePullRequestsRecent",
            content: "Show Recent Related PullRequests",
            selector: "node.File",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show recent pull requests make change: " },
                { edgeType: this._file_pull_request, isMultiLength: true, targetType: "PullRequest" },
                this._g.userPrefs.queryNeighborLimit.getValue()
              );
            },
          },
          {
            id: "showFilePullRequests",
            content: "Show Related PullRequests",
            selector: "node.File",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show pull requests make change: " },
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
                { isNode: true, customTxt: "Hide pull requests make change: " },
                { edgeType: this._file_pull_request, isMultiLength: true, targetType: "PullRequest" }
              );
            },
          },
        ]
      },
      {
        id: "file_issue",
        content: "Issue ",
        selector: "node.File",
        hasTrailingDivider: true,
        submenu: [
          {
            id: "showFileIssue",
            content: "Show Recent Related Issues",
            selector: "node.File",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show recent related issues: " },
                { edgeType: this._file_issue, isMultiLength: true, targetType: "Issue" },
                this._g.userPrefs.queryNeighborLimit.getValue()
              );
            },
          },
          {
            id: "showFileIssue",
            content: "Show Related Issues",
            selector: "node.File",
            onClickFunction: (x) => {
              this.getNeighbors(
                x,
                { isNode: true, customTxt: "Show related issues: " },
                { edgeType: this._file_issue, isMultiLength: true, targetType: "Issue" }
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
                { isNode: true, customTxt: "Hide related issues: " },
                { edgeType: this._file_issue, isMultiLength: true, targetType: "Issue" }
              );
            },
          },
        ]
      }
    ];
  }

  getNeighbors(event, historyMeta: HistoryMetaData, queryMeta: DbQueryMeta, limit?: number) {
    const ele = event.target || event.cyTarget;
    const targetNodeId = ele._private.data.id;
    this._dbService.getNeighbors(
      [ele.id().substr(1)],
      (x) => {
        this._cyService.loadElementsFromDatabase(x, true,false);
      },
      historyMeta,
      queryMeta,
      limit
    );
  }
  isAnyHidden() {
    return this._g.cy.$().map(x => x.hidden()).filter(x => x).length > 0;
  }
  deleteNeighbors(event, historyMeta: HistoryMetaData, queryMeta: DbQueryMeta) {
    const ele = event.target || event.cyTarget;
    const targetNodeId = ele._private.data.id;
    let hideSet = this._g.cy.collection();
    this._dbService.getNeighbors(
      [ele.id().substr(1)],
      (x) => {
        x.nodes.forEach(element => {
          if ((`n${element.elementId}` != targetNodeId) && (!queryMeta.targetType || queryMeta.targetType === element.labels[0])) {
            if (!queryMeta.isMultiLength) {
              const edge = this._g.cy.edges(`[source="${targetNodeId}"][target="n${element.elementId}"]`);
              const edge2 = this._g.cy.edges(`[source="n${element.elementId}"][target="${targetNodeId}"]`);
              if (edge.nonempty() | edge2.nonempty()) {
                hideSet = hideSet.add(this._g.cy.elements(`[id = "n${element.elementId}"]`));
              }
            } else {
              hideSet = hideSet.add(this._g.cy.elements(`[id = "n${element.elementId}"]`));
            }
          }
        });
        this._g.viewUtils.hide(hideSet);
        this._cyService.hideCompounds(hideSet);
        this._g.applyClassFiltering();
        if (hideSet.length > 0) {
          this._g.performLayout(false,false,500, false);
        }
      },
      historyMeta,
      queryMeta
    );

  }

  reportAnomaly(event) {
      const ele = event.target;
      this._g.cy.$().unselect();
      this._g.cy.$id(ele.id()).select();
      this._g.openReportTab.next(true);
      if(this._g.openReportTab.getValue()){
        if (this._g.isSwitch2ObjTabOnSelect) {
          this._g.operationTabChanged.next(0);
        }
      }

  }

}
