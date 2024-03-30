CREATE TABLE `applications` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`tenant_id` text(255) NOT NULL,
	`name` text(255) NOT NULL,
	`client_secret` text(255),
	`allowed_callback_urls` text(255),
	`allowed_logout_urls` text(255),
	`allowed_web_origins` text(255),
	`authentication_settings` text(255),
	`styling_settings` text(255),
	`email_validation` text(255),
	`created_at` text(255),
	`updated_at` text(255)
);
--> statement-breakpoint
CREATE TABLE `codes` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`tenant_id` text(255) NOT NULL,
	`user_id` text(255) NOT NULL,
	`type` text(255) NOT NULL,
	`created_at` text(255) NOT NULL,
	`expires_at` text(255) NOT NULL,
	`used_at` text(255),
	`code` text(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `connections` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`tenant_id` text(255) NOT NULL,
	`name` text(255) NOT NULL,
	`client_id` text(255),
	`client_secret` text(255),
	`authorization_endpoint` text(255),
	`token_endpoint` text(255),
	`scope` text(255),
	`response_type` text(255),
	`response_mode` text(255),
	`private_key` text(767),
	`kid` text(255),
	`team_id` text(255),
	`created_at` text(255),
	`updated_at` text(255),
	`userinfo_endpoint` text(256)
);
--> statement-breakpoint
CREATE TABLE `domains` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`tenant_id` text(255) NOT NULL,
	`domain` text(255) NOT NULL,
	`email_service` text(255),
	`email_api_key` text(255),
	`dkim_private_key` text(2048),
	`dkim_public_key` text(2048),
	`created_at` text(255),
	`updated_at` text(255)
);
--> statement-breakpoint
CREATE TABLE `keys` (
	`kid` text(255) PRIMARY KEY NOT NULL,
	`tenant_id` text(255),
	`private_key` text(8192),
	`public_key` text(1024),
	`created_at` text(255),
	`revoked_at` text(255)
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`tenant_id` text(255) NOT NULL,
	`user_id` text(255) NOT NULL,
	`ip` text(255),
	`type` text(255),
	`date` text(255),
	`description` text(255),
	`client_id` text(255),
	`client_name` text(255),
	`user_agent` text(255),
	`details` text(8192),
	`user_name` text(255),
	`auth0_client` text(255),
	`isMobile` integer,
	`connection` text(255),
	`connection_id` text(255),
	`audience` text(255),
	`scope` text(255),
	`strategy` text(255),
	`strategy_type` text(255),
	`hostname` text(255),
	`session_connection` text(255),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`tenant_id` text(255) NOT NULL,
	`sub` text(255),
	`email` text(255),
	`name` text(255),
	`status` text(255),
	`role` text(255),
	`picture` text(255),
	`created_at` text(255),
	`updated_at` text(255),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `migrations` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`tenant_id` text(255) NOT NULL,
	`provider` text(255),
	`client_id` text(255),
	`origin` text(255),
	`domain` text(255),
	`created_at` text(255),
	`updated_at` text(255),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `otps` (
	`tenant_id` text(255) NOT NULL,
	`id` text(255) PRIMARY KEY NOT NULL,
	`client_id` text(255) NOT NULL,
	`code` text(255) NOT NULL,
	`email` text(255) NOT NULL,
	`user_id` text(255),
	`send` text(255),
	`nonce` text(255),
	`state` text(1024),
	`scope` text(1024),
	`response_type` text(256),
	`response_mode` text(256),
	`redirect_uri` text(1024),
	`created_at` text(255) NOT NULL,
	`expires_at` text(255) NOT NULL,
	`used_at` text(255),
	`audience` text(255),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `passwords` (
	`tenant_id` text(255) NOT NULL,
	`user_id` text(255) PRIMARY KEY NOT NULL,
	`created_at` text(255),
	`updated_at` text(255),
	`password` text(255) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`tenant_id` text(255) NOT NULL,
	`id` text(255) PRIMARY KEY NOT NULL,
	`client_id` text(255) NOT NULL,
	`user_id` text(255) NOT NULL,
	`created_at` text(255),
	`expires_at` text(255),
	`used_at` text(255),
	`deleted_at` text(255),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text(255),
	`audience` text(255),
	`sender_email` text(255),
	`sender_name` text(255),
	`language` text(255),
	`logo` text(255),
	`primary_color` text(255),
	`secondary_color` text(255),
	`created_at` text(255),
	`updated_at` text(255),
	`support_url` text(255)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`tenant_id` text(255) NOT NULL,
	`id` text(255) PRIMARY KEY NOT NULL,
	`client_id` text(255) NOT NULL,
	`email` text(255) NOT NULL,
	`nonce` text(255),
	`state` text(1024),
	`scope` text(1024),
	`response_type` text(256),
	`response_mode` text(256),
	`redirect_uri` text(1024),
	`created_at` text(255) NOT NULL,
	`expires_at` text(255) NOT NULL,
	`used_at` text(255),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `universal_login_sessions` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`tenant_id` text(255) NOT NULL,
	`client_id` text(255) NOT NULL,
	`username` text(255),
	`response_type` text(255),
	`response_mode` text(255),
	`audience` text(255),
	`scope` text(511),
	`state` text(511),
	`code_challenge_method` text(256),
	`code_challenge` text(256),
	`redirect_uri` text(256),
	`created_at` text(255) NOT NULL,
	`updated_at` text(255) NOT NULL,
	`expires_at` text(255) NOT NULL,
	`nonce` text(255),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text(255) NOT NULL,
	`tenant_id` text(255) NOT NULL,
	`email` text(255) NOT NULL,
	`given_name` text(255),
	`family_name` text(255),
	`nickname` text(255),
	`name` text(255),
	`picture` text(2083),
	`created_at` text(255),
	`updated_at` text(255),
	`linked_to` text(255),
	`last_ip` text(255),
	`login_count` integer,
	`last_login` text(255),
	`provider` text(255),
	`connection` text(255),
	`email_verified` integer,
	`is_social` integer,
	`app_metadata` text(8092),
	`profileData` text(2048),
	`locale` text(255),
	PRIMARY KEY(`id`, `tenant_id`),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`linked_to`,`tenant_id`) REFERENCES `users`(`id`,`tenant_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `codes_expires_at_index` ON `codes` (`expires_at`);--> statement-breakpoint
CREATE INDEX `logs_user_id_index` ON `logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `logs_tenant_id_index` ON `logs` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `logs_date_index` ON `logs` (`date`);--> statement-breakpoint
CREATE INDEX `otps_email_index` ON `otps` (`email`);--> statement-breakpoint
CREATE INDEX `otps_expires_at_index` ON `otps` (`expires_at`);--> statement-breakpoint
CREATE INDEX `users_email_index` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_linked_to_index` ON `users` (`linked_to`);--> statement-breakpoint
CREATE INDEX `users_name_index` ON `users` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_email_provider` ON `users` (`email`,`provider`,`tenant_id`);