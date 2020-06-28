export declare namespace GithubCheckInfo {
    interface CreateBase {
        name: string;
        owner: string;
        repo: string;
        head_sha: string;
        started_at: string;
    }
    interface UpdateBase {
        check_run_id: number;
        owner: string;
        repo: string;
    }
    interface CompletedCreate extends CreateBase {
        status: 'completed';
        completed_at: string;
        conclusion: GitHubAnnotation.Conclusion;
        output: GitHubAnnotation.Output;
    }
    interface InProgressCreate extends CreateBase {
        status: "in_progress";
        output?: GitHubAnnotation.Output;
    }
    interface InProgressUpdate extends UpdateBase {
        status: "in_progress";
        output?: GitHubAnnotation.Output;
    }
    interface CompletionUpdate extends UpdateBase {
        status: 'completed';
        completed_at: string;
        conclusion: GitHubAnnotation.Conclusion;
        output: GitHubAnnotation.Output;
    }
    type Update = CompletionUpdate | InProgressUpdate;
    type Create = CompletedCreate | InProgressCreate;
    type Any = Create | Update;
}
export interface GitHubAnnotation {
    path: string;
    annotation_level: GitHubAnnotation.Level;
    start_line: number;
    start_column?: number;
    end_line: number;
    end_column?: number;
    message: string;
    raw_details?: string;
    title?: string;
}
export declare namespace GitHubAnnotation {
    type Level = 'notice' | 'warning' | 'failure';
    type Conclusion = "success" | "failure" | "neutral" | "cancelled" | "timed_out" | "action_required" | undefined;
    interface Output {
        title: string;
        summary: string;
        text?: string;
        annotations?: GitHubAnnotation[];
    }
}
