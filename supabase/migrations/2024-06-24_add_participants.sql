-- 2024-06-24_add_participants.sql
-- Migration: add participants column to retros table

alter table retros
  add column participants int not null default 0;
