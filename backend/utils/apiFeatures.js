class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering (gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  search(fields = ['name']) {
    if (this.queryString.search) {
      const searchRegex = new RegExp(this.queryString.search, 'i');
      const searchConditions = fields.map(field => ({ [field]: searchRegex }));
      this.query = this.query.find({ $or: searchConditions });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      // Map frontend sort values to MongoDB sort fields
      const sortMap = {
        'popular': '-totalOrders -rating',
        'rating': '-rating -totalReviews',
        'price_asc': 'price discountPrice',
        'price_desc': '-price -discountPrice',
        'newest': '-createdAt',
        'oldest': 'createdAt'
      };
      const sortValue = sortMap[this.queryString.sort] || this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortValue);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;
    return this;
  }
}

module.exports = APIFeatures;
