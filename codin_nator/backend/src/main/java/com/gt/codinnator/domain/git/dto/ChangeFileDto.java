package com.gt.codinnator.domain.git.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ChangeFileDto {
    Long fileId;
    String fileName;
    String content;
}

