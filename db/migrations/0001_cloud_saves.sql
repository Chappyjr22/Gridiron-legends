-- Applied as one transaction. No client can write these tables directly.
CREATE TABLE public.career_cloud_saves (
 user_id text PRIMARY KEY, revision bigint NOT NULL CHECK(revision>0),
 mutation_id text NOT NULL, payload jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.career_cloud_history (
 user_id text NOT NULL, revision bigint NOT NULL, payload jsonb NOT NULL,
 updated_at timestamptz NOT NULL, PRIMARY KEY(user_id,revision)
);
ALTER TABLE public.career_cloud_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_cloud_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_save ON public.career_cloud_saves USING(user_id=auth.user_id());
CREATE POLICY own_history ON public.career_cloud_history USING(user_id=auth.user_id());
CREATE FUNCTION public.career_cloud_read() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT coalesce((SELECT jsonb_build_object('revision',revision,'payload',payload,'updatedAt',updated_at) FROM public.career_cloud_saves WHERE user_id=auth.user_id()),'{"revision":0,"payload":null}'::jsonb)
$$;
CREATE FUNCTION public.career_cloud_write(expected_revision bigint, mutation text, save_payload jsonb) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE uid text:=auth.user_id(); current_save public.career_cloud_saves; next_rev bigint;
BEGIN
 IF uid IS NULL OR uid='' THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
 IF expected_revision<0 OR length(mutation)>100 OR length(mutation)<8 OR jsonb_typeof(save_payload)<>'object' OR octet_length(save_payload::text)>5000000 THEN RAISE EXCEPTION 'Invalid save'; END IF;
 -- Serialize creation as well as updates for one account.
 PERFORM pg_advisory_xact_lock(hashtextextended(uid,0));
 SELECT * INTO current_save FROM public.career_cloud_saves WHERE user_id=uid;
 IF current_save.mutation_id=mutation THEN RETURN jsonb_build_object('revision',current_save.revision); END IF;
 IF coalesce(current_save.revision,0)<>expected_revision THEN RETURN jsonb_build_object('conflict',true,'revision',coalesce(current_save.revision,0)); END IF;
 next_rev:=coalesce(current_save.revision,0)+1;
 IF current_save.revision IS NOT NULL THEN
  INSERT INTO public.career_cloud_history VALUES(uid,current_save.revision,current_save.payload,current_save.updated_at);
 END IF;
 INSERT INTO public.career_cloud_saves VALUES(uid,next_rev,mutation,save_payload,now())
 ON CONFLICT(user_id) DO UPDATE SET revision=excluded.revision,mutation_id=excluded.mutation_id,payload=excluded.payload,updated_at=excluded.updated_at;
 RETURN jsonb_build_object('revision',next_rev);
END $$;
CREATE FUNCTION public.career_cloud_history_list() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('revision',revision,'updatedAt',updated_at)),'[]'::jsonb) FROM
 (SELECT revision,updated_at FROM public.career_cloud_history WHERE user_id=auth.user_id() ORDER BY revision DESC LIMIT 20) h
$$;
CREATE FUNCTION public.career_cloud_history_read(save_revision bigint) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT payload FROM public.career_cloud_history WHERE user_id=auth.user_id() AND revision=save_revision
$$;
REVOKE ALL ON public.career_cloud_saves,public.career_cloud_history FROM PUBLIC,authenticated,anonymous;
REVOKE ALL ON FUNCTION public.career_cloud_read(),public.career_cloud_write(bigint,text,jsonb),public.career_cloud_history_list(),public.career_cloud_history_read(bigint) FROM PUBLIC,anonymous;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.career_cloud_read(),public.career_cloud_write(bigint,text,jsonb),public.career_cloud_history_list(),public.career_cloud_history_read(bigint) TO authenticated;
