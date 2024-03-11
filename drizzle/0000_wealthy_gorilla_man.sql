-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `applications` (
	`id` varchar(255) NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`client_secret` varchar(255),
	`allowed_callback_urls` varchar(255),
	`allowed_logout_urls` varchar(255),
	`allowed_web_origins` varchar(255),
	`authentication_settings` varchar(255),
	`styling_settings` varchar(255),
	`email_validation` varchar(255),
	`created_at` varchar(255),
	`updated_at` varchar(255),
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codes` (
	`id` varchar(255) NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`created_at` varchar(255) NOT NULL,
	`expires_at` varchar(255) NOT NULL,
	`used_at` varchar(255),
	`code` varchar(255) NOT NULL,
	CONSTRAINT `codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connections` (
	`id` varchar(255) NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`client_id` varchar(255),
	`client_secret` varchar(255),
	`authorization_endpoint` varchar(255),
	`token_endpoint` varchar(255),
	`scope` varchar(255),
	`response_type` varchar(255),
	`response_mode` varchar(255),
	`private_key` varchar(767),
	`kid` varchar(255),
	`team_id` varchar(255),
	`created_at` varchar(255),
	`updated_at` varchar(255),
	`userinfo_endpoint` varchar(256),
	CONSTRAINT `connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `domains` (
	`id` varchar(255) NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`domain` varchar(255) NOT NULL,
	`email_service` varchar(255),
	`email_api_key` varchar(255),
	`dkim_private_key` varchar(2048),
	`dkim_public_key` varchar(2048),
	`created_at` varchar(255),
	`updated_at` varchar(255),
	CONSTRAINT `domains_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `keys` (
	`kid` varchar(255) NOT NULL,
	`tenant_id` varchar(255),
	`private_key` varchar(8192),
	`public_key` varchar(1024),
	`created_at` varchar(255),
	`revoked_at` varchar(255),
	CONSTRAINT `keys_kid` PRIMARY KEY(`kid`)
);
--> statement-breakpoint
CREATE TABLE `kysely_migration` (
	`name` varchar(255) NOT NULL,
	`timestamp` varchar(255) NOT NULL,
	CONSTRAINT `kysely_migration_name` PRIMARY KEY(`name`)
);
--> statement-breakpoint
CREATE TABLE `kysely_migration_lock` (
	`id` varchar(255) NOT NULL,
	`is_locked` int NOT NULL DEFAULT 0,
	CONSTRAINT `kysely_migration_lock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` varchar(255) NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`ip` varchar(255),
	`type` varchar(255),
	`date` varchar(255),
	`description` varchar(255),
	`client_id` varchar(255),
	`client_name` varchar(255),
	`user_agent` varchar(255),
	`details` varchar(8192),
	`user_name` varchar(255),
	`auth0_client` varchar(255),
	`isMobile` tinyint,
	`connection` varchar(255),
	`connection_id` varchar(255),
	`audience` varchar(255),
	`scope` varchar(255),
	`strategy` varchar(255),
	`strategy_type` varchar(255),
	`hostname` varchar(255),
	`session_connection` varchar(255),
	CONSTRAINT `logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` varchar(255) NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`sub` varchar(255),
	`email` varchar(255),
	`name` varchar(255),
	`status` varchar(255),
	`role` varchar(255),
	`picture` varchar(255),
	`created_at` varchar(255),
	`updated_at` varchar(255),
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `migrations` (
	`id` varchar(255) NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`provider` varchar(255),
	`client_id` varchar(255),
	`origin` varchar(255),
	`domain` varchar(255),
	`created_at` varchar(255),
	`updated_at` varchar(255),
	CONSTRAINT `migrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `otps` (
	`tenant_id` varchar(255) NOT NULL,
	`id` varchar(255) NOT NULL,
	`client_id` varchar(255) NOT NULL,
	`code` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`user_id` varchar(255),
	`send` varchar(255),
	`nonce` varchar(255),
	`state` varchar(1024),
	`scope` varchar(1024),
	`response_type` varchar(256),
	`response_mode` varchar(256),
	`redirect_uri` varchar(1024),
	`created_at` varchar(255) NOT NULL,
	`expires_at` varchar(255) NOT NULL,
	`used_at` varchar(255),
	`audience` varchar(255),
	CONSTRAINT `otps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `passwords` (
	`tenant_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`created_at` varchar(255),
	`updated_at` varchar(255),
	`password` varchar(255) NOT NULL,
	CONSTRAINT `passwords_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`tenant_id` varchar(255) NOT NULL,
	`id` varchar(255) NOT NULL,
	`client_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`created_at` varchar(255),
	`expires_at` varchar(255),
	`used_at` varchar(255),
	`deleted_at` varchar(255),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255),
	`audience` varchar(255),
	`sender_email` varchar(255),
	`sender_name` varchar(255),
	`language` varchar(255),
	`logo` varchar(255),
	`primary_color` varchar(255),
	`secondary_color` varchar(255),
	`created_at` varchar(255),
	`updated_at` varchar(255),
	`support_url` varchar(255),
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`tenant_id` varchar(255) NOT NULL,
	`id` varchar(255) NOT NULL,
	`client_id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`nonce` varchar(255),
	`state` varchar(1024),
	`scope` varchar(1024),
	`response_type` varchar(256),
	`response_mode` varchar(256),
	`redirect_uri` varchar(1024),
	`created_at` varchar(255) NOT NULL,
	`expires_at` varchar(255) NOT NULL,
	`used_at` varchar(255),
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `universal_login_sessions` (
	`id` varchar(255) NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`client_id` varchar(255) NOT NULL,
	`username` varchar(255),
	`response_type` varchar(255),
	`response_mode` varchar(255),
	`audience` varchar(255),
	`scope` varchar(511),
	`state` varchar(511),
	`code_challenge_method` varchar(256),
	`code_challenge` varchar(256),
	`redirect_uri` varchar(256),
	`created_at` varchar(255) NOT NULL,
	`updated_at` varchar(255) NOT NULL,
	`expires_at` varchar(255) NOT NULL,
	`nonce` varchar(255),
	CONSTRAINT `universal_login_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(255) NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`given_name` varchar(255),
	`family_name` varchar(255),
	`nickname` varchar(255),
	`name` varchar(255),
	`picture` varchar(2083),
	`created_at` varchar(255),
	`updated_at` varchar(255),
	`linked_to` varchar(255),
	`last_ip` varchar(255),
	`login_count` int,
	`last_login` varchar(255),
	`provider` varchar(255),
	`connection` varchar(255),
	`email_verified` tinyint,
	`is_social` tinyint,
	`app_metadata` varchar(8092),
	`profileData` varchar(2048),
	`locale` varchar(255),
	CONSTRAINT `users_id_tenant_id` PRIMARY KEY(`id`,`tenant_id`),
	CONSTRAINT `unique_email_provider` UNIQUE(`email`,`provider`,`tenant_id`)
);
--> statement-breakpoint
CREATE INDEX `codes_expires_at_index` ON `codes` (`expires_at`);--> statement-breakpoint
CREATE INDEX `logs_user_id` ON `logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `logs_tenant_id` ON `logs` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `logs_date` ON `logs` (`date`);--> statement-breakpoint
CREATE INDEX `otps_email_index` ON `otps` (`email`);--> statement-breakpoint
CREATE INDEX `otps_expires_at_index` ON `otps` (`expires_at`);--> statement-breakpoint
CREATE INDEX `users_email_index` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_linked_to_index` ON `users` (`linked_to`);--> statement-breakpoint
CREATE INDEX `users_name_index` ON `users` (`name`);
*/