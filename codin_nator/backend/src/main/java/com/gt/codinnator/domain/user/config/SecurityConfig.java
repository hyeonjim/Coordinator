package com.gt.codinnator.domain.user.config;

import com.gt.codinnator.domain.user.service.CustomOAuth2UserService;
import com.gt.codinnator.domain.user.utils.JwtAuthenticationFilter;
import com.gt.codinnator.domain.user.utils.JwtTokenProvider;
import com.gt.codinnator.domain.user.utils.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity // Spring Security 설정을 활성화
@RequiredArgsConstructor
public class SecurityConfig {

    // 유저 정보 처리 서비스
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final JwtTokenProvider jwtTokenProvider;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // 로컬 개발 시에는 편의상 disable (배포 시 보안 검토 필요)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // 세션 사용 안함
                .headers(headers -> headers.frameOptions(frame -> frame.disable())) // H2 콘솔 등을 쓸 경우 대비
                .authorizeHttpRequests(auth -> auth
                                .requestMatchers("/", "/login/**", "/oauth2/**").permitAll()
                                .anyRequest().authenticated()
                )
                .logout(logout -> logout
                        .logoutSuccessUrl("/") // 로그아웃 성공 시 이동할 페이지
                )
                .oauth2Login(oauth2 -> oauth2
                                .defaultSuccessUrl("/") // 로그인 성공 후 이동할 페이지
                         .userInfoEndpoint(userInfo -> userInfo
                            .userService(customOAuth2UserService) // GitHub에서 가져온 유저 정보를 처리할 서비스 등록
                         )
                        .successHandler(oAuth2SuccessHandler) // 성공 시 JWT 핸들러 실행
                )
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}