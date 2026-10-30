import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {sqliteStore,postgresStore} from '../database.js';
import {createApp} from '../server.js';
import {hashPassword} from '../admin.js';

// 1x1 valid PNG image bytes
const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

for(const backend of ['sqlite','postgres'])test(backend+': campus marquee, teacher reviews and picture throwing arena',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'class-campus-')),engine=backend==='postgres'?new PGlite():null;
 const query=async(sql,args)=>{const result=await engine.query(sql,args);return {...result,rowCount:result.affectedRows}};
 const pool={query,connect:async()=>({query,release(){}}),end:async()=>{}};
 const old=process.env.ADMIN_PASSWORD_HASH;process.env.ADMIN_PASSWORD_HASH=await hashPassword('campus-test-password');let server;
 try{
  const store=engine?await postgresStore(pool):sqliteStore(dir);
  await store.add({id:'c'.repeat(32),owner:'legacy',name:'原同学',text:'原留言保持',date:new Date().toISOString()});
  await store.saveSetting('announcement','原公告保持');
  server=await createApp(dir,store);await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;

  const client=()=>{
    const cookies=new Map();
    return async(route,method='GET',body,headers={})=>{
      const isBuffer = Buffer.isBuffer(body);
      const defaultContentType = isBuffer ? 'application/octet-stream' : 'application/json';
      const r=await fetch(base+'/api'+route,{
        method,
        headers:{
          ...(body!==undefined && !headers['Content-Type'] ? {'Content-Type': defaultContentType} : {}),
          Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; '),
          ...headers
        },
        ...(body===undefined?{}:{body:isBuffer?body:JSON.stringify(body)})
      });
      for(const raw of r.headers.getSetCookie()){
        const c=raw.split(';')[0],i=c.indexOf('=');
        cookies.set(c.slice(0,i),c.slice(i+1));
      }
      return {
        status:r.status,
        headers:r.headers,
        data:r.headers.get('content-type')?.includes('application/json')?await r.json():await r.text()
      };
    };
  };

  const admin=client(),student1=client(),student2=client();

  // 1. Initial public states
  const initMarquee = await student1('/marquee');
  assert.equal(initMarquee.status, 200);
  assert.ok(initMarquee.data.messages.length >= 1);
  const initTeachers = await student1('/teachers');
  assert.equal(initTeachers.status, 200);
  assert.ok(initTeachers.data.teachers.length >= 3);
  assert.equal((await student1('/targets')).status, 200);
  assert.deepEqual((await student1('/targets')).data.targets, []);

  // 2. Admin authorization checks
  assert.equal((await student1('/admin/campus/marquee','POST',{text:'未授权广播'})).status, 401);
  assert.equal((await student1('/admin/campus/teachers','POST',{name:'王老师',subject:'数据结构'})).status, 401);
  assert.equal((await admin('/admin/login','POST',{password:'campus-test-password'})).status, 200);

  // 3. Marquee tests
  const initialMarqueeCount = initMarquee.data.messages.length;
  const addMarqueeRes = await admin('/admin/campus/marquee','POST',{
    text:'通知：明早8点机房上课！',
    author:'学习委员'
  });
  assert.equal(addMarqueeRes.status, 201);
  const marqueeId = addMarqueeRes.data.id;
  assert.ok(marqueeId);

  const marqueeList = await student1('/marquee');
  assert.equal(marqueeList.status, 200);
  assert.equal(marqueeList.data.messages.length, initialMarqueeCount + 1);
  assert.ok(marqueeList.data.messages.some(m => m.text === '通知：明早8点机房上课！' && m.author === '学习委员'));

  // 4. Teacher Base & Anonymous Reviews
  const initialTeacherCount = initTeachers.data.teachers.length;
  const addTeacherRes = await admin('/admin/campus/teachers','POST',{
    name:'陈教授',
    subject:'操作系统'
  });
  assert.equal(addTeacherRes.status, 201);
  const teacherId = addTeacherRes.data.id;

  const teachersList = await student1('/teachers');
  assert.equal(teachersList.status, 200);
  assert.equal(teachersList.data.teachers.length, initialTeacherCount + 1);
  const createdTeacher = teachersList.data.teachers.find(t => t.id === teacherId);
  assert.ok(createdTeacher);
  assert.equal(createdTeacher.name, '陈教授');
  assert.equal(createdTeacher.review_count, 0);

  // Student 1 submits an anonymous review
  const addReviewRes = await student1(`/teachers/${teacherId}/reviews`,'POST',{
    rating: 5,
    tag: '讲解透彻',
    nickname: '匿名秃头码农',
    content: '老师讲进程调度非常生动，大作业很锻炼人！'
  });
  assert.equal(addReviewRes.status, 201);
  const reviewId = addReviewRes.data.id;

  // Check teacher reviews list for student 1 vs student 2
  const reviews1 = await student1(`/teachers/${teacherId}/reviews`);
  assert.equal(reviews1.status, 200);
  assert.equal(reviews1.data.reviews.length, 1);
  assert.equal(reviews1.data.reviews[0].mine, true);
  assert.equal(reviews1.data.reviews[0].content, '老师讲进程调度非常生动，大作业很锻炼人！');

  const reviews2 = await student2(`/teachers/${teacherId}/reviews`);
  assert.equal(reviews2.status, 200);
  assert.equal(reviews2.data.reviews[0].mine, false);

  // Student 2 cannot delete student 1's review
  assert.equal((await student2(`/teachers/${teacherId}/reviews/${reviewId}`,'DELETE')).status, 403);

  // Student 1 can delete own review
  assert.equal((await student1(`/teachers/${teacherId}/reviews/${reviewId}`,'DELETE')).status, 200);
  const afterDeleteReviews = await student1(`/teachers/${teacherId}/reviews`);
  assert.equal(afterDeleteReviews.data.reviews.length, 0);

  // Post another review for admin moderation test
  const review2Res = await student2(`/teachers/${teacherId}/reviews`,'POST',{
    rating: 4,
    tag: '严谨认真',
    nickname: '路过的猫咪',
    content: '期末复习重点很清晰。'
  });
  const review2Id = review2Res.data.id;

  // Admin can moderate/delete review
  assert.equal((await admin(`/admin/campus/reviews/${review2Id}`,'DELETE')).status, 200);

  // 5. Target Picture Throwing Arena
  // Student 1 uploads a target image using raw binary stream
  const uploadRes = await student1('/targets?title=' + encodeURIComponent('今日高数卷子'),'POST', tinyPng, {
    'Content-Type': 'image/png'
  });
  assert.equal(uploadRes.status, 201);
  const targetId = uploadRes.data.id;
  assert.ok(targetId);

  // Verify binary image served
  const imgRes = await fetch(base + `/api/targets/${targetId}/image`);
  assert.equal(imgRes.status, 200);
  assert.equal(imgRes.headers.get('content-type'), 'image/jpeg');

  // Throw items at the target
  const throwEgg = await student2(`/targets/${targetId}/throw`,'POST',{
    item: 'egg',
    x: 0.455,
    y: 0.602
  });
  assert.equal(throwEgg.status, 200);
  assert.equal(throwEgg.data.itemCounts.egg, 1);

  const throwSlipper = await student1(`/targets/${targetId}/throw`,'POST',{
    item: 'slipper',
    x: 0.800,
    y: 0.200
  });
  assert.equal(throwSlipper.status, 200);

  // Invalid throws
  assert.equal((await student1(`/targets/${targetId}/throw`,'POST',{item:'anvil',x:0.1,y:0.1})).status, 400);
  assert.equal((await student1(`/targets/${targetId}/throw`,'POST',{item:'egg',x:-0.5,y:0.1})).status, 400);
  assert.equal((await student1(`/targets/${targetId}/throw`,'POST',{item:'egg',x:1.5,y:0.1})).status, 400);

  // Check splats and item counts
  const splatsRes = await student1(`/targets/${targetId}/splats`);
  assert.equal(splatsRes.status, 200);
  assert.equal(splatsRes.data.splats.length, 2);
  assert.equal(splatsRes.data.itemCounts.egg, 1);
  assert.equal(splatsRes.data.itemCounts.slipper, 1);

  // Student 2 cannot delete student 1's target
  assert.equal((await student2(`/targets/${targetId}`,'DELETE')).status, 403);

  // Admin can delete target
  assert.equal((await admin(`/admin/campus/targets/${targetId}`,'DELETE')).status, 200);
  assert.equal((await fetch(base + `/api/targets/${targetId}/image`)).status, 404);

  // 6. Admin deletes marquee & teacher
  assert.equal((await admin(`/admin/campus/marquee/${marqueeId}`,'DELETE')).status, 200);
  assert.equal((await admin(`/admin/campus/teachers/${teacherId}`,'DELETE')).status, 200);

  // 7. Data preservation check
  assert.equal((await store.notes('check'))[0].text, '原留言保持');
  assert.equal(await store.setting('announcement'), '原公告保持');

  // 8. Static files isolation and security
  for (const route of ['/campus.css', '/campus-client.js', '/campus-admin.js']) {
    assert.equal((await fetch(base + route)).status, 200);
  }
  for (const route of ['/campus.js', '/campus-database.js', '/scripts/migrate-campus.js']) {
    assert.equal((await fetch(base + route)).status, 404);
  }

 }finally{
  if(old===undefined)delete process.env.ADMIN_PASSWORD_HASH;
  else process.env.ADMIN_PASSWORD_HASH=old;
  if(server?.listening)await new Promise(r=>{server.close(r);server.closeAllConnections()});
  await engine?.close();
  await rm(dir,{recursive:true,force:true});
 }
});
