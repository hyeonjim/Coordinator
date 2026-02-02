package com.gt.codinnator.domain.git.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangeFileDto {
    Long fileId;
    String content;
}
