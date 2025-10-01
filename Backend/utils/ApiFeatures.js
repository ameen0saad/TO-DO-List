// utils/ApiFeatures.js
class ApiFeatures {
  constructor(model, queryStr) {
    this.model = model;
    this.queryStr = queryStr;
    this.queryOptions = {
      where: {},
      orderBy: [],
      select: null,
      skip: 0,
      take: 100, // Default limit
    };
  }

  filter(userId) {
    const queryObject = { ...this.queryStr };
    const excludedFields = ['sort', 'limit', 'page', 'fields', 'search', 'include'];
    excludedFields.forEach((el) => delete queryObject[el]);

    if (userId) {
      queryObject.userId = userId;
    }

    // Convert query string to Prisma where object
    const where = {};

    for (const [key, value] of Object.entries(queryObject)) {
      if (typeof value === 'object' && value !== null) {
        // Handle operators: {gte: 18, lte: 65}
        where[key] = {};
        for (const [operator, opValue] of Object.entries(value)) {
          where[key][this.mapOperator(operator)] = this.parseValue(opValue);
        }
      } else {
        where[key] = this.parseValue(value);
      }
    }

    if (Object.keys(where).length > 0) {
      this.queryOptions.where = { ...this.queryOptions.where, ...where };
    }

    return this;
  }

  search() {
    if (this.queryStr.search) {
      const searchTerm = this.queryStr.search;
      const searchFields = this.queryStr.searchFields
        ? this.queryStr.searchFields.split(',')
        : ['name', 'email']; // Default search fields

      if (searchFields.length > 0) {
        const searchConditions = searchFields.map((field) => ({
          [field]: { contains: searchTerm, mode: 'insensitive' },
        }));

        this.queryOptions.where = {
          ...this.queryOptions.where,
          OR: searchConditions,
        };
      }
    }
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortFields = this.queryStr.sort.split(',');

      sortFields.forEach((field) => {
        const isDesc = field.startsWith('-');
        const fieldName = isDesc ? field.slice(1) : field;
        this.queryOptions.orderBy.push({
          [fieldName]: isDesc ? 'desc' : 'asc',
        });
      });
    } else {
      // Default sorting
      this.queryOptions.orderBy.push({ createdAt: 'asc' });
    }
    return this;
  }

  /**
   * Field selection: ?fields=id,name,email
   */
  select() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(',');
      const selectObj = {};

      fields.forEach((field) => {
        selectObj[field] = true;
      });

      this.queryOptions.select = selectObj;
    }
    return this;
  }

  /**
   * Include relations: ?include=posts,profile
   */
  include() {
    if (this.queryStr.include) {
      const relations = this.queryStr.include.split(',');
      const includeObj = {};

      relations.forEach((relation) => {
        includeObj[relation] = true;
      });

      this.queryOptions.include = includeObj;
    }
    return this;
  }

  /**
   * Pagination: ?page=2&limit=10
   */
  paginate() {
    const page = Math.max(1, parseInt(this.queryStr.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(this.queryStr.limit) || 100));
    const skip = (page - 1) * limit;

    this.queryOptions.skip = skip;
    this.queryOptions.take = limit;
    this.paginationInfo = { page, limit, skip };

    return this;
  }

  /**
   * Execute the query and return results with pagination info
   */
  async execute() {
    const [data, total] = await Promise.all([
      this.model.findMany(this.queryOptions),
      this.model.count({ where: this.queryOptions.where }),
    ]);

    const { page, limit } = this.paginationInfo || { page: 1, limit: 100 };
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get only the query options without executing
   */
  getQueryOptions() {
    return this.queryOptions;
  }

  // Helper methods
  mapOperator(operator) {
    const operatorMap = {
      gte: 'gte',
      gt: 'gt',
      lte: 'lte',
      lt: 'lt',
      ne: 'not',
      in: 'in',
      nin: 'notIn',
      contains: 'contains',
    };
    return operatorMap[operator] || operator;
  }

  parseValue(value) {
    // Try to parse numbers and booleans
    if (!isNaN(value) && value !== '') {
      return Number(value);
    }
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;

    return value;
  }
}

export default ApiFeatures;
