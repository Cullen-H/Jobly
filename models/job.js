"user strict"

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
    /** Create a job (from data), update db, return new job data.
        *
        * data should be { title, salary, equity, companyHandle }
        *
        * Returns { id, title, salary, equity, companyHandle }
        */

    static async create({ title, salary, equity, companyHandle }) {
        const result = await db.query(
        `INSERT INTO jobs (title,
                           salary,
                           equity,
                           company_handle)
         VALUES ($1, $2, $3, $4)
         RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [title, salary, equity, companyHandle]);
        const job = result.rows[0];
        return job;
    }

    /** Find all jobs.
        *
        * Optional search filters (title, minSalary, hasEquity)
        *   title - case-insensitive and can match any part of the string
        *   minSalary - filters jobs to at least this salary
        *   hasEquity - If true, filters to jobs that provide non-zero amount of equity
        *             - If false or not included as paramater, lists jobs regardless of equity
        *
        * Returns [{ id, title, salary, equity, companyHandle, companyname }, ...]
        */

    static async findAll(filter={}) {
        const { title, minSalary, hasEquity } = filter;
        let query = 
            `SELECT j.id,
                    j.title,
                    j.salary,
                    j.equity,
                    j.company_handle AS "companyHandle",
                    c.name AS "companyName"
             FROM jobs j LEFT JOIN companies AS c ON c.handle = j.company_handle`;

        let values=[];
        let wheres=[];

        if (title) {
            values.push(`%${title}%`);
            wheres.push(`title ILIKE $${values.length}`)
        }

        if (minSalary !== undefined) {
            values.push(minSalary);
            wheres.push(`salary >= $${values.length}`);
        }

        if (hasEquity === true) {
            wheres.push(`equity > 0`);
        }

        if (wheres.length > 0) {
            query += " WHERE " + wheres.join(" AND ");
        }

        query += " ORDER BY title "
        const jobsRes = await db.query(query, values);
        return jobsRes.rows;
    }

    /** Given a job id, return data about job.
        * 
        * Returns { id, title, salary, equity, companyHandle, company }
        *   where company is { handle, name, description, numEmployees, logoUrl }
        *
        * Throws NotFoundError if not found.
        */

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
             FROM jobs
             WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`)

        const companyRes = await db.query(
            `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
             FROM companies
             WHERE handle = $1`,
            [job.companyHandle]);

        job.company = companyRes.rows[0];
        return job;
    }

    /** Update a job with `data`.
        *
        * This is a "partial update" --- it's fine if data doesn't contain all the
        * fields; this only changes provided ones.
        *
        * Data can include: { title, salary, quity }
        *
        * Returns { id, title, salary, equity, companyHandle }
        *
        * Throws NotFoundError if not found.
        */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                          SET ${setCols}
                          WHERE id = ${idVarIdx}
                          RETURNING id,
                                    title,
                                    salary,
                                    equity,
                                    company_handle AS "companyHandle"`;

        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
        return job;
    }

    /** Delete a given job from database; returns undefined.
        *
        * Throws NotFoundError if not found.
        */

    static async remove(id) {
        const result = await db.query(
            `DELETE
             FROM jobs
             WHERE id = $1
             RETURNING id`, [id]);
        const job = result.rows[0];
        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;
