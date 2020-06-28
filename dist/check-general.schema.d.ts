declare const _exports: {
    "$schema": string;
    "$id": string;
    "type": string;
    "properties": {
        "name": {
            "type": string;
            "description": string;
        };
        "description": {
            "type": string;
            "description": string;
        };
        "summary": {
            "type": string;
            "description": string;
        };
        "counts": {
            "description": string;
            "type": string;
            "properties": {
                "notice": {
                    "type": string;
                    "description": string;
                };
                "warning": {
                    "type": string;
                    "description": string;
                };
                "failure": {
                    "type": string;
                    "description": string;
                };
            };
            "additionalProperties": boolean;
            "required": string[];
        };
        "byFile": {
            "type": string;
            "description": string;
            "additionalProperties": {
                "type": string;
                "required": string[];
                "properties": {
                    "summary": {
                        "type": string;
                    };
                    "counts": {
                        "properties": {
                            "notice": {
                                "type": string;
                                "description": string;
                            };
                            "warning": {
                                "type": string;
                                "description": string;
                            };
                            "failure": {
                                "type": string;
                                "description": string;
                            };
                        };
                        "additionalProperties": boolean;
                        "required": string[];
                        "type": string;
                        "description": string;
                    };
                    "details": {
                        "type": string;
                        "items": {
                            "type": string;
                            "properties": {
                                "Id": {
                                    "type": string;
                                    "description": string;
                                };
                                "message": {
                                    "type": string;
                                    "description": string;
                                };
                                "category": {
                                    "type": string;
                                    "description": string;
                                    "enum": string[];
                                };
                                "startLine": {
                                    "type": string;
                                };
                                "startColumn": {
                                    "type": string;
                                };
                                "endLine": {
                                    "type": string;
                                };
                                "endColumn": {
                                    "type": string;
                                };
                            };
                            "additionalProperties": boolean;
                            "required": string[];
                        };
                    };
                };
                "additionalProperties": boolean;
            };
        };
    };
    "additionalProperties": boolean;
    "required": string[];
};
export = _exports;
