package com.gt.codinnator.domain.room.repository;

import com.gt.codinnator.domain.room.entity.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, Long> {
    // 특정 방에 참여 중인 유저 목록을 찾기 위한 메서드 (나중에 쓰임)
    List<Participant> findByRoomId(Long roomId);
}