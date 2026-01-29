package com.gt.codinnator.domain.git.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GitInfo {
    private String gitUrl;
    private String accessToken;
    private String branchName;
}
