import { Request, Response } from 'express';

// 统一成功响应
export function success(res: Response, data: any, message: string = '操作成功') {
  return res.json({
    code: 0,
    message,
    data,
  });
}

// 统一失败响应
export function fail(res: Response, message: string = '操作失败', code: number = -1) {
  return res.json({
    code,
    message,
    data: null,
  });
}

// 分页响应
export function paginate(res: Response, list: any[], total: number, page: number, pageSize: number) {
  return res.json({
    code: 0,
    message: '查询成功',
    data: {
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / Number(pageSize)),
    },
  });
}

// 从请求中获取分页参数
export function getPageParams(req: Request) {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, take: pageSize };
}
