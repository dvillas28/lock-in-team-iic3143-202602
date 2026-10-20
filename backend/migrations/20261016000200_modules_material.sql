-- Up Migration
CREATE TABLE public.course_modules (
 id uuid PRIMARY KEY, institution_id uuid NOT NULL, course_id uuid NOT NULL,
 title varchar(200) NOT NULL CHECK(title=btrim(title) AND char_length(title) BETWEEN 1 AND 200),
 position integer NOT NULL CHECK(position>0), published_at timestamptz(6),
 UNIQUE(institution_id,id),
 CONSTRAINT course_modules_position_key UNIQUE(institution_id,course_id,position) DEFERRABLE INITIALLY IMMEDIATE,
 FOREIGN KEY(institution_id,course_id) REFERENCES public.courses(institution_id,id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE TABLE public.materials (
 id uuid PRIMARY KEY, institution_id uuid NOT NULL, module_id uuid NOT NULL,
 title varchar(200) NOT NULL CHECK(title=btrim(title) AND char_length(title) BETWEEN 1 AND 200),
 kind varchar(16) NOT NULL DEFAULT 'markdown' CHECK(kind='markdown'),
 markdown_body text NOT NULL CHECK(char_length(markdown_body) BETWEEN 1 AND 10000 AND btrim(markdown_body)<>''),
 published_at timestamptz(6), created_by uuid NOT NULL,
 UNIQUE(institution_id,id),
 FOREIGN KEY(institution_id,module_id) REFERENCES public.course_modules(institution_id,id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(institution_id,created_by) REFERENCES public.institution_memberships(institution_id,user_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX materials_module_idx ON public.materials(institution_id,module_id,id);

-- Down Migration
DROP TABLE public.materials;
DROP TABLE public.course_modules;
