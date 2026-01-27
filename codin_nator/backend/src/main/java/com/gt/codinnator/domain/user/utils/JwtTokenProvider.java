package com.gt.codinnator.domain.user.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    private final long tokenValidityInMilliseconds = 1000L * 60 * 60 * 24; // 24시간

    // 토큰 생성
    public String createToken(String gitId) {
        Claims claims = Jwts.claims().setSubject(gitId);
        Date now = new Date();
        Date validity = new Date(now.getTime() + tokenValidityInMilliseconds);

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(SignatureAlgorithm.HS256, secretKey)
                .compact();
    }

    // JwtTokenProvider 클래스 내부에 추가
    public boolean validateToken(String token) {
        try {
            Jws<Claims> claims = Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token);
            return !claims.getBody().getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public Authentication getAuthentication(String token) {
        String gitId = Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token).getBody().getSubject();

        // 단순 권한 부여 (실제 DB 조회 후 UserDetails를 넣는 것이 더 정석적입니다)
        return new UsernamePasswordAuthenticationToken(gitId, "",
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")));
    }
}