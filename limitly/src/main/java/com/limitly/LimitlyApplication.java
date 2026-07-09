package com.limitly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LimitlyApplication {

	public static void main(String[] args) {
		SpringApplication.run(LimitlyApplication.class, args);
	}

}
