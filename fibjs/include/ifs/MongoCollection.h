/***************************************************************************
 *   Copyright (C) 2012 by Leo Hoo                                         *
 *   lion@9465.net                                                         *
 *                                                                         *
 ***************************************************************************/

#ifndef _MongoCollection_base_H_
#define _MongoCollection_base_H_

/**
 @author Leo Hoo <lion@9465.net>
 */

#include "../object.h"

namespace fibjs
{

class MongoCursor_base;

class MongoCollection_base : public object_base
{
public:
	// MongoCollection_base
	virtual result_t find(v8::Handle<v8::Object> query, v8::Handle<v8::Object> projection, obj_ptr<MongoCursor_base>& retVal) = 0;
	virtual result_t findOne(v8::Handle<v8::Object> query, v8::Handle<v8::Object> projection, v8::Handle<v8::Object>& retVal) = 0;
	virtual result_t findAndModify(v8::Handle<v8::Object> query, v8::Handle<v8::Object>& retVal) = 0;
	virtual result_t insert(v8::Handle<v8::Array> documents) = 0;
	virtual result_t insert(v8::Handle<v8::Object> document) = 0;
	virtual result_t save(v8::Handle<v8::Object> document) = 0;
	virtual result_t update(v8::Handle<v8::Object> query, v8::Handle<v8::Object> document, bool upsert, bool multi) = 0;
	virtual result_t update(v8::Handle<v8::Object> query, v8::Handle<v8::Object> document, v8::Handle<v8::Object> options) = 0;
	virtual result_t remove(v8::Handle<v8::Object> query) = 0;
	virtual result_t runCommand(v8::Handle<v8::Object> cmd, v8::Handle<v8::Object>& retVal) = 0;
	virtual result_t runCommand(const char* cmd, v8::Handle<v8::Object> arg, v8::Handle<v8::Object>& retVal) = 0;
	virtual result_t drop() = 0;
	virtual result_t ensureIndex(v8::Handle<v8::Object> keys, v8::Handle<v8::Object> options) = 0;
	virtual result_t reIndex(v8::Handle<v8::Object>& retVal) = 0;
	virtual result_t dropIndex(const char* name, v8::Handle<v8::Object>& retVal) = 0;
	virtual result_t dropIndexes(v8::Handle<v8::Object>& retVal) = 0;
	virtual result_t getIndexes(obj_ptr<MongoCursor_base>& retVal) = 0;
	virtual result_t getCollection(const char* name, obj_ptr<MongoCollection_base>& retVal) = 0;
	virtual result_t _named_getter(const char* property, obj_ptr<MongoCollection_base>& retVal) = 0;
	virtual result_t _named_enumerator(v8::Handle<v8::Array>& retVal) = 0;

	DECLARE_CLASSINFO(MongoCollection_base);

public:
	static v8::Handle<v8::Value> s_find(const v8::Arguments& args);
	static v8::Handle<v8::Value> s_findOne(const v8::Arguments& args);
	static v8::Handle<v8::Value> s_findAndModify(const v8::Arguments& args);
	static v8::Handle<v8::Value> s_insert(const v8::Arguments& args);
	static v8::Handle<v8::Value> s_save(const v8::Arguments& args);
	static v8::Handle<v8::Value> s_update(const v8::Arguments& args);
	static v8::Handle<v8::Value> s_remove(const v8::Arguments& args);
	static v8::Handle<v8::Value> s_runCommand(const v8::Arguments& args);
	static v8::Handle<v8::Value> s_drop(const v8::Arguments& args);
	static v8::Handle<v8::Value> s_ensureIndex(const v8::Arguments& args);
	static v8::Handle<v8::Value> s_reIndex(const v8::Arguments& args);
	static v8::Handle<v8::Value> s_dropIndex(const v8::Arguments& args);
	static v8::Handle<v8::Value> s_dropIndexes(const v8::Arguments& args);
	static v8::Handle<v8::Value> s_getIndexes(const v8::Arguments& args);
	static v8::Handle<v8::Value> s_getCollection(const v8::Arguments& args);
	static v8::Handle<v8::Value> i_NamedGetter(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Array> i_NamedEnumerator(const v8::AccessorInfo& info);
};

}

#include "MongoCursor.h"

namespace fibjs
{
	inline ClassInfo& MongoCollection_base::class_info()
	{
		static ClassData::ClassMethod s_method[] = 
		{
			{"find", s_find},
			{"findOne", s_findOne},
			{"findAndModify", s_findAndModify},
			{"insert", s_insert},
			{"save", s_save},
			{"update", s_update},
			{"remove", s_remove},
			{"runCommand", s_runCommand},
			{"drop", s_drop},
			{"ensureIndex", s_ensureIndex},
			{"reIndex", s_reIndex},
			{"dropIndex", s_dropIndex},
			{"dropIndexes", s_dropIndexes},
			{"getIndexes", s_getIndexes},
			{"getCollection", s_getCollection}
		};

		static ClassData::ClassNamed s_named = 
		{
			i_NamedGetter, i_NamedSetter, i_NamedDeleter, i_NamedEnumerator
		};

		static ClassData s_cd = 
		{ 
			"MongoCollection", NULL, 
			15, s_method, 0, NULL, 0, NULL, NULL, &s_named,
			&object_base::class_info()
		};

		static ClassInfo s_ci(s_cd);
		return s_ci;
	}

	inline v8::Handle<v8::Value> MongoCollection_base::i_NamedGetter(v8::Local<v8::String> property, const v8::AccessorInfo& info)
	{
		obj_ptr<MongoCollection_base> vr;

		PROPERTY_ENTER();
		PROPERTY_INSTANCE(MongoCollection_base);

		v8::String::Utf8Value k(property);
		if(class_info().has(*k))return v8::Handle<v8::Value>();

		hr = pInst->_named_getter(*k, vr);
		if(hr == CALL_RETURN_NULL)return v8::Handle<v8::Value>();

		METHOD_RETURN();
	}

	inline v8::Handle<v8::Array> MongoCollection_base::i_NamedEnumerator(const v8::AccessorInfo& info)
	{
		v8::Handle<v8::Array> vr;

		PROPERTY_ENTER();
		PROPERTY_INSTANCE(MongoCollection_base);

		hr = pInst->_named_enumerator(vr);

		METHOD_RETURN1();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_find(const v8::Arguments& args)
	{
		obj_ptr<MongoCursor_base> vr;

		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(2, 0);

		OPT_ARG(v8::Handle<v8::Object>, 0, v8::Object::New());
		OPT_ARG(v8::Handle<v8::Object>, 1, v8::Object::New());

		hr = pInst->find(v0, v1, vr);

		METHOD_RETURN();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_findOne(const v8::Arguments& args)
	{
		v8::Handle<v8::Object> vr;

		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(2, 0);

		OPT_ARG(v8::Handle<v8::Object>, 0, v8::Object::New());
		OPT_ARG(v8::Handle<v8::Object>, 1, v8::Object::New());

		hr = pInst->findOne(v0, v1, vr);

		METHOD_RETURN();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_findAndModify(const v8::Arguments& args)
	{
		v8::Handle<v8::Object> vr;

		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(1, 1);

		ARG(v8::Handle<v8::Object>, 0);

		hr = pInst->findAndModify(v0, vr);

		METHOD_RETURN();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_insert(const v8::Arguments& args)
	{
		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(1, 1);

		ARG(v8::Handle<v8::Array>, 0);

		hr = pInst->insert(v0);

		METHOD_OVER(1, 1);

		ARG(v8::Handle<v8::Object>, 0);

		hr = pInst->insert(v0);

		METHOD_VOID();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_save(const v8::Arguments& args)
	{
		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(1, 1);

		ARG(v8::Handle<v8::Object>, 0);

		hr = pInst->save(v0);

		METHOD_VOID();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_update(const v8::Arguments& args)
	{
		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(4, 2);

		ARG(v8::Handle<v8::Object>, 0);
		ARG(v8::Handle<v8::Object>, 1);
		OPT_ARG(bool, 2, false);
		OPT_ARG(bool, 3, false);

		hr = pInst->update(v0, v1, v2, v3);

		METHOD_OVER(3, 3);

		ARG(v8::Handle<v8::Object>, 0);
		ARG(v8::Handle<v8::Object>, 1);
		ARG(v8::Handle<v8::Object>, 2);

		hr = pInst->update(v0, v1, v2);

		METHOD_VOID();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_remove(const v8::Arguments& args)
	{
		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(1, 1);

		ARG(v8::Handle<v8::Object>, 0);

		hr = pInst->remove(v0);

		METHOD_VOID();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_runCommand(const v8::Arguments& args)
	{
		v8::Handle<v8::Object> vr;

		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(1, 1);

		ARG(v8::Handle<v8::Object>, 0);

		hr = pInst->runCommand(v0, vr);

		METHOD_OVER(2, 1);

		ARG_String(0);
		OPT_ARG(v8::Handle<v8::Object>, 1, v8::Object::New());

		hr = pInst->runCommand(v0, v1, vr);

		METHOD_RETURN();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_drop(const v8::Arguments& args)
	{
		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(0, 0);

		hr = pInst->drop();

		METHOD_VOID();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_ensureIndex(const v8::Arguments& args)
	{
		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(2, 1);

		ARG(v8::Handle<v8::Object>, 0);
		OPT_ARG(v8::Handle<v8::Object>, 1, v8::Object::New());

		hr = pInst->ensureIndex(v0, v1);

		METHOD_VOID();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_reIndex(const v8::Arguments& args)
	{
		v8::Handle<v8::Object> vr;

		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(0, 0);

		hr = pInst->reIndex(vr);

		METHOD_RETURN();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_dropIndex(const v8::Arguments& args)
	{
		v8::Handle<v8::Object> vr;

		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(1, 1);

		ARG_String(0);

		hr = pInst->dropIndex(v0, vr);

		METHOD_RETURN();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_dropIndexes(const v8::Arguments& args)
	{
		v8::Handle<v8::Object> vr;

		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(0, 0);

		hr = pInst->dropIndexes(vr);

		METHOD_RETURN();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_getIndexes(const v8::Arguments& args)
	{
		obj_ptr<MongoCursor_base> vr;

		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(0, 0);

		hr = pInst->getIndexes(vr);

		METHOD_RETURN();
	}

	inline v8::Handle<v8::Value> MongoCollection_base::s_getCollection(const v8::Arguments& args)
	{
		obj_ptr<MongoCollection_base> vr;

		METHOD_INSTANCE(MongoCollection_base);
		METHOD_ENTER(1, 1);

		ARG_String(0);

		hr = pInst->getCollection(v0, vr);

		METHOD_RETURN();
	}

}

#endif

