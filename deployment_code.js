// import { ChatGroq } from "@langchain/groq";
import 'dotenv/config'
import { DynamicStructuredTool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
// import { object } from 'webidl-conversions';

var open_api_key = process.env.OPENAI_API_KEY; // Output: localhost
var sectors_api_key = process.env.SECTORS_API_KEY; // Output: root

const model = new ChatOpenAI( {model : "gpt-3.5-turbo", temperature : 0, apiKey:open_api_key
});


const get_peers = new DynamicStructuredTool({
  name:"get_peers",
  description:"Get peers or competitors for a stock",
  schema : z.object({
    ticker:z.string().length(4, "Stock ticker should only contain up to 4 alphabetic characters").describe("Stock ticker to search for")
  }),
  func: async({ticker}) => {
    const url =  `https://api.sectors.app/v1/company/report/${ticker}/?sections=peers`
    
    
      // Menggunakan fetch untuk mengambil data
      try {
          const response = await fetch(url,{
              method: 'GET',
              headers: {
                  'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
                  'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
              },
          
          } );
          const data = await response.json();
          // console.log(response.headers.Authorization)
          const peers = data.peers 
          let output  = []
          peers.forEach(p => {
            const company = p.peers_info.companies 
            company.forEach(c => {
              let result = {}
              result.company_name = c.company_name
              result.symbol = c.symbol
            });
          });
          return output;
      } catch (error) {
          console.error('Error fetching data:', error);
          throw error;}
      }
})

const get_top_companies_based_on_transaction_volume = new DynamicStructuredTool({
  name: "get_top_companies_based_on_transaction_volume",
  description: "Get top companies based on transaction volume",
  schema: z.object({
    start_date: z.string().describe("A filter indicating the minimum date from which data is retrieved" ),
    top_n : z.number().describe("The number of companies that have higher value")
    }),  
  func: async ({start_date, top_n}) => { 
    console.log(start_date)
    const url =  `https://api.sectors.app/v1/most-traded/?start=${start_date}&end=${start_date}&n_stock=${top_n}`
    
    // Menggunakan fetch untuk mengambil data
    try {
        const response = await fetch(url,{
            method: 'GET',
            headers: {
                'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
                'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
            },
        
        } );
        const data = await response.json();
        // console.log(response.headers.Authorization)
        
        const companies = data[start_date]
        // console.log(data)

        const output = []
        companies.forEach(c => {
          const result = {}
          result.company_name = c.company_name
          result.symbol = c.symbol
          output.push(result)
        });

        return output;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;  // Re-throw the error after logging it
    }
  },
})

const get_top_m_cap_companies_by_subsector = new DynamicStructuredTool({
  name: "get_top_m_cap_companies_by_subsector",
  description: "Get companies that have higher market capital on certain subsector",

  schema: z.object({
    sub_sector: z.string().describe("subsector of listed companies")
    }),  

  func: async ({sub_sector}) => { 
    // console.log("buzz")
    const sub_sector_with_strip = sub_sector.toLowerCase().replace(" ", "-")
    const url =  `https://api.sectors.app/v1/subsector/report/${sub_sector_with_strip}/?sections=companies`
    // console.log(sub_sector.toLowerCase())
    
    // Menggunakan fetch untuk mengambil data
    try {
      const response = await fetch(url,{
          method: 'GET',
          headers: {
              'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
              'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
          },
      
      } );
      
      const data = await response.json();
      // console.log(response.headers.Authorization)
      // const companies = data[start_date]
      // console.log(data)
      const top_mcap = data["companies"]["top_companies"]["top_mcap"]
      const output = []
        top_mcap.forEach(c => {
          const result = {}
          // result.company_name = c.company_name
          result.symbol = c.symbol
          output.push(result)
        });
      return output;
  } catch (error) {
      console.error('Error fetching data:', error);
      throw error;  // Re-throw the error after logging it
  }
  },
})

const get_top_growth_companies_by_subsector = new DynamicStructuredTool({
  name: "get_top_growth_companies_by_subsector",
  description: "Get companies that have higher growth value on certain subsector",

  schema: z.object({
    sub_sector: z.string().describe("subsector of listed companies")
    }),  

  func: async ({sub_sector}) => { 
    // console.log("buzz")
    const sub_sector_with_strip = sub_sector.toLowerCase().replace(" ", "-")
    const url =  `https://api.sectors.app/v1/subsector/report/${sub_sector_with_strip}/?sections=companies`
    // console.log(sub_sector.toLowerCase())
    
    // Menggunakan fetch untuk mengambil data
    try {
      const response = await fetch(url,{
          method: 'GET',
          headers: {
              'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
              'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
          },
      
      } );
      
      const data = await response.json();
      // console.log(response.headers.Authorization)
      // const companies = data[start_date]
      // console.log(data)
      const top_mcap = data["companies"]["top_companies"]["top_growth"]
      const output = []
        top_mcap.forEach(c => {
          const result = {}
          // result.company_name = c.company_name
          result.symbol = c.symbol
          output.push(result)
        });
      return output;
  } catch (error) {
      console.error('Error fetching data:', error);
      throw error;  // Re-throw the error after logging it
  }
  },
})

const get_top_revenue_companies_by_subsector = new DynamicStructuredTool({
  name: "get_top_revenue_companies_by_subsector",
  description: "Get companies that have higher revenue on certain subsector",

  schema: z.object({
    sub_sector: z.string().describe("subsector of listed companies")
    }),  

  func: async ({sub_sector}) => { 
    // console.log("buzz")
    const sub_sector_with_strip = sub_sector.toLowerCase().replace(" ", "-")
    const url =  `https://api.sectors.app/v1/subsector/report/${sub_sector_with_strip}/?sections=companies`
    // console.log(sub_sector.toLowerCase())
    
    // Menggunakan fetch untuk mengambil data
    try {
      const response = await fetch(url,{
          method: 'GET',
          headers: {
              'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
              'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
          },
      
      } );
      
      const data = await response.json();
      // console.log(response.headers.Authorization)
      // const companies = data[start_date]
      // console.log(data)
      const top_mcap = data["companies"]["top_companies"]["top_revenue"]
      const output = []
        top_mcap.forEach(c => {
          const result = {}
          // result.company_name = c.company_name
          result.symbol = c.symbol
          output.push(result)
        });
      return output;
  } catch (error) {
      console.error('Error fetching data:', error);
      throw error;  // Re-throw the error after logging it
  }
  },
})

const get_top_change_companies_by_subsector = new DynamicStructuredTool({
  name: "get_top_change_companies_by_subsector",
  description: "Get companies that have higher price change on certain subsector",

  schema: z.object({
    sub_sector: z.string().describe("subsector of listed companies")
    }),  

  func: async ({sub_sector}) => { 
    // console.log("buzz")
    const sub_sector_with_strip = sub_sector.toLowerCase().replace(" ", "-")
    const url =  `https://api.sectors.app/v1/subsector/report/${sub_sector_with_strip}/?sections=companies`
    // console.log(sub_sector.toLowerCase())
    
    // Menggunakan fetch untuk mengambil data
    try {
      const response = await fetch(url,{
          method: 'GET',
          headers: {
              'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
              'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
          },
      
      } );
      
      const data = await response.json();
      // console.log(response.headers.Authorization)
      // const companies = data[start_date]
      // console.log(data)
      const top_change = data["companies"]["top_change_companies"]
      const output = []
        top_change.forEach(c => {
          const result = {}
          // result.company_name = c.company_name
          result.symbol = c.symbol
          output.push(result)
        });
      return output;
  } catch (error) {
      console.error('Error fetching data:', error);
      throw error;  // Re-throw the error after logging it
  }
  },
})

const get_top_dividend_yield_companies= new DynamicStructuredTool({
  name: "get_top_dividend_yield_companies",
  description: "Get top companies that have higher dividend yield",

  schema: z.object({
    top_n : z.number().describe("The number of companies that have higher value"),
    year:z.number().describe("The year in which the data was taken")
    }),  

  func: async ({top_n, year}) => { 
    // console.log("buzz")
    // const sub_sector_with_strip = sub_sector.toLowerCase().replace(" ", "-")
    const url =  `https://api.sectors.app/v1/companies/top/?classifications=dividend_yield&n_stock=${top_n}&year=${year}`
    // console.log(sub_sector.toLowerCase())
    
    // Menggunakan fetch untuk mengambil data
    try {
      const response = await fetch(url,{
          method: 'GET',
          headers: {
              'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
              'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
          },
      
      } );
      
      const data = await response.json();
      // console.log(response.headers.Authorization)
      // const companies = data[start_date]
      // console.log(data)
      const top_dividend_yield = data["dividend_yield"]
      const output = []
        top_dividend_yield.forEach(c => {
          const result = {}
          // result.company_name = c.company_name
          result.symbol = c.symbol
          output.push(result)
        });
      return output;
  } catch (error) {
      console.error('Error fetching data:', error);
      throw error;  // Re-throw the error after logging it
  }
  },
})

const get_top_total_dividend_companies= new DynamicStructuredTool({
  name: "get_top_total_dividend_companies",
  description: "Get top companies that have higher total dividend",

  schema: z.object({
    top_n : z.number().describe("The number of companies that have higher value"),
    year:z.number().describe("The year in which the data was taken")
    }),  

  func: async ({top_n, year}) => { 
    // console.log("buzz")
    // const sub_sector_with_strip = sub_sector.toLowerCase().replace(" ", "-")
    const url =  `https://api.sectors.app/v1/companies/top/?classifications=total_dividend&n_stock=${top_n}&year=${year}`
    // console.log(sub_sector.toLowerCase())
    
    // Menggunakan fetch untuk mengambil data
    try {
      const response = await fetch(url,{
          method: 'GET',
          headers: {
              'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
              'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
          },
      
      } );
      
      const data = await response.json();
      // console.log(response.headers.Authorization)
      // const companies = data[start_date]
      // console.log(data)
      const top_total_dividend = data["total_dividend"]
      const output = []
        top_total_dividend.forEach(c => {
          const result = {}
          // result.company_name = c.company_name
          result.symbol = c.symbol
          output.push(result)
        });
      return output;
  } catch (error) {
      console.error('Error fetching data:', error);
      throw error;  // Re-throw the error after logging it
  }
  },
})

const get_top_revenue_companies= new DynamicStructuredTool({
  name: "get_top_revenue_companies",
  description: "Get top companies that have higher revenue",

  schema: z.object({
    top_n : z.number().describe("The number of companies that have higher value"),
    year:z.number().describe("The year in which the data was taken")
    }),  

  func: async ({top_n, year}) => { 
    // console.log("buzz")
    // const sub_sector_with_strip = sub_sector.toLowerCase().replace(" ", "-")
    const url =  `https://api.sectors.app/v1/companies/top/?classifications=revenue&n_stock=${top_n}&year=${year}`
    // console.log(sub_sector.toLowerCase())
    
    // Menggunakan fetch untuk mengambil data
    try {
      const response = await fetch(url,{
          method: 'GET',
          headers: {
              'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
              'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
          },
      
      } );
      
      const data = await response.json();
      // console.log(response.headers.Authorization)
      // const companies = data[start_date]
      // console.log(data)
      const top_revenue = data["revenue"]
      const output = []
        top_revenue.forEach(c => {
          const result = {}
          // result.company_name = c.company_name
          result.symbol = c.symbol
          output.push(result)
        });
      return output;
  } catch (error) {
      console.error('Error fetching data:', error);
      throw error;  // Re-throw the error after logging it
  }
  },
})

const get_top_earnings_companies= new DynamicStructuredTool({
  name: "get_top_earnings_companies",
  description: "Get top companies that have higher earnings value",

  schema: z.object({
    top_n : z.number().describe("The number of companies that have higher value"),
    year:z.number().describe("The year in which the data was taken")
    }),  

  func: async ({top_n, year}) => { 
    // console.log("buzz")
    // const sub_sector_with_strip = sub_sector.toLowerCase().replace(" ", "-")
    const url =  `https://api.sectors.app/v1/companies/top/?classifications=earnings&n_stock=${top_n}&year=${year}`
    // console.log(sub_sector.toLowerCase())
    
    // Menggunakan fetch untuk mengambil data
    try {
      const response = await fetch(url,{
          method: 'GET',
          headers: {
              'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
              'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
          },
      
      } );
      
      const data = await response.json();
      // console.log(response.headers.Authorization)
      // const companies = data[start_date]
      // console.log(data)
      const top_earnings = data["earnings"]
      const output = []
        top_earnings.forEach(c => {
          const result = {}
          // result.company_name = c.company_name
          result.symbol = c.symbol
          output.push(result)
        });
      return output;
  } catch (error) {
      console.error('Error fetching data:', error);
      throw error;  // Re-throw the error after logging it
  }
  },
})

// const categories = "elek"

const get_companies_by_subsector_and_subindustries = new DynamicStructuredTool({
  name: "get_companies_by_subsector_and_subindustries",
  description: "Get companies based on subsector and subindustries",

  schema: z.object({
    sub_industry: z.string().describe("subindustry of listed companies")
    }),  

  func: async ({sub_industry}) => { 
    console.log(sub_industry)
    const sub_industry_with_strip = sub_industry.toLowerCase().replace(" ", "-")
    // console.log("buzz")
    const url =  `https://api.sectors.app/v1/companies/?sub_industry=${sub_industry_with_strip}`
    // console.log(sub_sector.toLowerCase())
    
    // Menggunakan fetch untuk mengambil data
    try {
      const response = await fetch(url,{
          method: 'GET',
          headers: {
              'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
              'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
          },
      
      } );

      // console.log(response.status)
      if (response.status == 400) {
        const url =  `https://api.sectors.app/v1/companies/?sub_sector=${sub_sector.toLowerCase()}`
    // console.log(sub_sector.toLowerCase())
    
        // Menggunakan fetch untuk mengambil data
        try {
          const response = await fetch(url,{
              method: 'GET',
              headers: {
                  'Authorization': sectors_api_key, // Ganti 'your-token-here' dengan token yang sesuai
                  'Content-Type': 'application/json', // Tambahkan header lain yang dibutuhkan
              },
          
          } );
          
          const data = await response.json();
          // console.log(response.headers.Authorization)
          // const companies = data[start_date]
          // console.log(data)
          return data;
      } catch (error) {
          console.error('Error fetching data:', error);
          throw error;  // Re-throw the error after logging it
      }
        
      }
      const data = await response.json();
      // console.log(response.headers.Authorization)
      // const companies = data[start_date]
      // console.log(data)
      return data;
  } catch (error) {
      console.error('Error fetching data:', error);
      throw error;  // Re-throw the error after logging it
  }
  },
})

const tools = [get_peers, get_top_companies_based_on_transaction_volume, get_companies_by_subsector_and_subindustries, get_top_m_cap_companies_by_subsector, get_top_growth_companies_by_subsector, get_top_revenue_companies_by_subsector, get_top_dividend_yield_companies, get_top_total_dividend_companies, get_top_revenue_companies, get_top_earnings_companies, get_top_change_companies_by_subsector]


const llm_with_tools = await model.bindTools(tools);


const queries = ["Give competitor of BBCA", "give top companies with higher transaction volume in 24 april 2024", "show the companies on banks sector", "give top bankscompanies by market capital","give top banks companies by growth", "give top banks companies by revenue", "give top banks companies by earnings","give 10 top companies by dividend yield","ive 10 top companies by total dividend","ive 10 top companies by revenue", "give 10 top companies by earnings","give top banks companies by price change"]

// const queries = ["give top companies with higher transaction volume in 24 april 2023"]

// const queries = [simple_query, intermediate_query, complex_query]

async function generate_output(query) {

    const startTime = Date.now(); 
  
    // const startTime = new Date().getTime();
    const messages = [
      new SystemMessage("You're a helpful assistant"),
      new HumanMessage(query),
    ];
    // console.log(message)
    // const chain = llm_with_tools.pipe(new Json);
    
    const ai_msg = await llm_with_tools.invoke(messages);
  // console.log("hai")
    ai_msg.tool_calls.forEach(tool_call => {

      // console.log(tool_call)
        const selected_tool = {
            "get_peers" : get_peers,
            "get_top_companies_based_on_transaction_volume":get_top_companies_based_on_transaction_volume,
            "get_companies_by_subsector_and_subindustries" : get_companies_by_subsector_and_subindustries,
            "get_top_m_cap_companies_by_subsector" : get_top_m_cap_companies_by_subsector,
            "get_top_growth_companies_by_subsector" : get_top_growth_companies_by_subsector,
            "get_top_revenue_companies_by_subsector" : get_top_revenue_companies_by_subsector,
            "get_top_change_companies_by_subsector":get_top_change_companies_by_subsector,
            "get_top_dividend_yield_companies" : get_top_dividend_yield_companies,
            "get_top_total_dividend_companies":get_top_total_dividend_companies,
            "get_top_revenue_companies":get_top_revenue_companies,
            "get_top_earnings_companies":get_top_earnings_companies,
        }[tool_call["name"].toLowerCase()]

        let tool_output =  selected_tool.invoke(tool_call["args"])
    
        tool_output.then((data) => {
          console.log(data);
          const endTime = Date.now(); 
          const timeTaken = endTime - startTime; 
  
          // console.log(`Result of addition = ${res}`); 
          console.log(`Time taken to perform addition = ${timeTaken} milliseconds`); 
          // return timeTaken;
          // console.log(`Waktu eksekusi: ${executionTime} milidetik`);
        }).catch((error) => {
          console.log("Promise rejected:", error);
        });
    });

}


// console.log(`Lenght of Query : ${queries.length}`)
// let timeListForQuery = []

queries.forEach(q => {
  generate_output(q)
  // timeListForQuery.push(timeComp)
  // console.log(timeComp)
});

// var total = 0;
// for(var i = 0; i < timeListForQuery.length; i++) {
//     total += timeListForQuery[i];
// }

// var avg = total / timeListForQuery.length;
// console.log(`Average of time computation : ${avg}`)



