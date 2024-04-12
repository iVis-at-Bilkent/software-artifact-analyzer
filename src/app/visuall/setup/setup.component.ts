  import { Component, Input, OnInit } from '@angular/core';
  import { ActivatedRoute, Router } from '@angular/router';
  import { HttpClient } from '@angular/common/http';
  import { GlobalVariableService } from '../../visuall/global-variable.service';
  import { environment } from 'src/environments/environment';
  
  @Component({
    selector: 'app-setup',
    templateUrl: './setup.component.html',
    styleUrls: ['./setup.component.css']
  })
  
  export class SetupComponent implements OnInit {
    
    @Input() setupValue: string = '';
    tool = "Software Artifact Analyzer"
    landingTool: string = "Github";
    //GitHub authentication credentials
  
    private githubClientId: string = environment.github.clientId;
    private githubClientSecret: string = environment.github.clientSecret;
    private redirectUrlFlowGithub: string = `http://${window.location.hostname}:${window.location.port}/?setup=Github`; //Will be change after production
    private githubCode: string = '';
    private githubInstallationId: string = '';
    //Jira authentication credentials
    private jiraClientId: string = environment.jira.clientId;
    private jiraClientSecret: string = environment.jira.clientSecret;
    private jiraCode: string = '';
    private redirectUrlFlowJira: string = '';
    //Neo4j Credentials
    private boltUrl: string = "bolt://ivis.cs.bilkent.edu.tr:3006";
    private httpUrl: string = "http://ivis.cs.bilkent.edu.tr:3004";
    private neo4jUsername: string ="neo4j" ;
    private neo4jUserPassword: string="01234567" ;
  constructor(private _g: GlobalVariableService, private route: ActivatedRoute, private http: HttpClient, private _http: HttpClient, private router: Router) { }

  async ngOnInit(): Promise<void> {
    this.redirectUrlFlowJira = window.location.hostname == "saa.cs.bilkent.edu.tr" ? 
    "https://saa.cs.bilkent.edu.tr/?setup=Jira" : 
    `http://${window.location.hostname}:${window.location.port}/?setup=Jira`;
    if (this.setupValue == "GitHub") {
      this.github()
    }
    else if (this.setupValue == "Jira") {
      this.jira()
    }
  }
  directToJira() {
    this.landingTool = "Github"
    const state = Math.random().toString(36).substring(2);
    //Will be change after production
    const url = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=s8vxvG5qiNGENrtsijGbheoFuihyjCa2&scope=offline_access%20read%3Ajira-work%20manage%3Ajira-project%20manage%3Ajira-configuration%20write%3Ajira-work%20read%3Ajira-user%20manage%3Ajira-webhook%20manage%3Ajira-data-provider&redirect_uri=https%3A%2F%2Fsaa.cs.bilkent.edu.tr%2F%3Fsetup%3DJira&state=${state}&response_type=code&prompt=consent`
    window.location.href = url;
  }
  directToGitHub() {

    this.landingTool = "Jira"
  }
  github() {
    this.route.queryParams.subscribe(params => {
      this.githubCode = params['code'];
      this.githubInstallationId = params['installation_id']
      if (this.githubCode) {
        this.exchangeCodeForTokenGithub();
      } else {
        console.error('Authorization code not received.');
      }
    });
  }
  onFormSubmit() {
    const credentials = {
      'boltURL':this.boltUrl,
      'httpURL':this.httpUrl + "/db/neo4j/tx/commit",
      'neo4jUsername': this.neo4jUsername,
      'neo4jUserPassword': this.neo4jUserPassword
    };
    let body = {
      "params": credentials,
    }
    let url = window.location.hostname == "saa.cs.bilkent.edu.tr" ? 
    "http://saa.cs.bilkent.edu.tr/api/connectNeo4j" : 
    `http://${window.location.hostname}:4445/connectNeo4j`;
    this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } })
      .subscribe(
        (response) => {
          console.info('Confirm request success', response);
          window.location.href = `http://${window.location.hostname}:${window.location.port}`;

        },
        (error) => {
          console.error('Confirm request error:', error);
        }
      );
  }

  jira() {
    if(this.landingTool == "Github"){
      this.route.queryParams.subscribe(params => {
        this.jiraCode = params['code'];
        if (this.jiraCode) {
          this.exchangeCodeForTokenJira();
        } else {
          console.error('Authorization code not received.');
        }
        //TODO: Implement Refresh token mechanism check: https://developer.atlassian.com/cloud/confluence/oauth-2-3lo-apps/#how-do-i-get-a-new-access-token--if-my-access-token-expires-or-is-revoked-
      });
    }else{
      //TODO: Second Flow
    }


  }
  async exchangeCodeForTokenJira() {
    const params = {
      "grant_type": "authorization_code",
      "client_id": this.jiraClientId,
      "client_secret": this.jiraClientSecret,
      "code": this.jiraCode,
      "redirect_uri": this.redirectUrlFlowJira
    }
    let body = {
      "params": params,
    }
    let url = window.location.hostname == "saa.cs.bilkent.edu.tr" ? 
    "http://saa.cs.bilkent.edu.tr/api/authenticateJira" : 
    `http://${window.location.hostname}:4445/authenticateJira`;
    console.log(body)
    this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } })
      .subscribe(
        (response) => {
          console.info('Confirm request success', response);
        },
        (error) => {
          console.error('Confirm request error:', error);
        }
      );
  }
  async exchangeCodeForTokenGithub() {
    const params = {
      client_id: this.githubClientId,
      client_secret: this.githubClientSecret,
      code: this.githubCode,
      installation_id: this.githubInstallationId,
      redirect_uri: this.redirectUrlFlowGithub
    };
    let body = {
      "params": params,
    }
    let url = window.location.hostname == "saa.cs.bilkent.edu.tr" ? 
    "http://saa.cs.bilkent.edu.tr/api/authenticateGithub" : 
    `http://${window.location.hostname}:4445/authenticateGithub`;
    this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } })
      .subscribe(
        (response) => {
          console.info('Confirm request success', response);
        },
        (error) => {
          console.error('Confirm request error:', error);
        }
      );
  }


}
