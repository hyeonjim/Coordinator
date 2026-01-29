package com.gt.codinnator.domain.git.service;

import com.gt.codinnator.domain.editor.repository.FileRepository;
import com.gt.codinnator.domain.git.dto.ChangeFileDto;
import com.gt.codinnator.domain.git.dto.GitInfo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class GitService {
    private Git git = null;
    private final FileRepository fileRepository;
//    private final CodeService codeService;
//    private final RoomRepository roomRepository;

    @Transactional
    public void saveAndGitAdd(Long roomId, Map<String, String> changeFileDto) throws IOException, GitAPIException {
//      Room room = roomRepository.findById(roomId)
//              .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 방입니다."));

        // 변경된 파일 하드디스크 저장
//        codeService.saveChangeFiles(roomId, changeFileDto);
        // 2. JGit 사용해서 git add 하기
        add(roomId);
    }

    // add하기
    public void add(Long roomId) throws IOException, GitAPIException {
//        Room room = roomRepository.findById(roomId)
//                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 방입니다."));
        String localPath = System.getProperty("user.home") + "/codinnator/uploads/" + roomId;
        git = Git.open(new File(localPath)); // 위에 로직으로 바꿀 예정
        git.add().addFilepattern(".").call();
    }

    // 커밋 메시지 날리기
    public void commitMessage(Long roomId, String message) throws Exception {
//        Room room = roomRepository.findById(roomId)
//                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 방입니다."));
//        git = Git.open(new File(room.getAccessToken()));
//        User user = userRepository.findById(room.userId())
//                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
//
//        git = Git.open(new File(room.getGitUrl)); // 위에 로직으로 바꿀 예정
//        git.commit()
//                .setMessage(message)
//                .setAuthor(user.getGitId(), user.getEmail())
//                .call();

        String localPath = System.getProperty("user.home") + "/codinnator/uploads/" + roomId;
        git = Git.open(new File(localPath)); // 위에 로직으로 바꿀 예정
        git.commit()
                .setMessage(message)
                .setAuthor("haeun-test", "haeun@naver.com")
                .call();
    }

    // 원격 저장소 푸쉬
    public void pushToRemote(Long roomId) throws Exception {
        //        Room room = roomRepository.findById(roomId)
//                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 방입니다."));
//        git = Git.open(new File(room.getAccessToken()));
//        User user = userRepository.findById(room.userId())
//                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
//         String localPath = System.getProperty("user.home") + "/codinnator/uploads/" + roomId;
//        git = Git.open(new File(localPath)); // 위에 로직으로 바꿀 예정
//        git.push()
//                .setCredentialsProvider(room.getAccessToken())
//                .setRemote(room.getBranchName())
//                .call();
        String localPath = System.getProperty("user.home") + "/codinnator/uploads/" + roomId;
        git = Git.open(new File(localPath)); // 위에 로직으로 바꿀 예정
        git.push()
                .setCredentialsProvider(new UsernamePasswordCredentialsProvider("haeun1700","***REMOVED***"))
                .setRemote("origin")
                .setRefSpecs(new org.eclipse.jgit.transport.RefSpec("HEAD:refs/heads/test-haeun-codinator"))
                .call();
    }
}